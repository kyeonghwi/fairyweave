import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateStory } from '../services/storyGenerator';
import { generateImages, generateCoverImage, PLACEHOLDER_IMAGE } from '../services/imageGenerator';
import { bookStore, generateId, progressTracker } from '../services/bookStore';
import type { GenerateStoryRequest, BookRecord, BookSpecUid, Language, StoryPage } from '../types/story';
import { BOOK_SPECS } from '../types/story';

const router = Router();

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

function sanitize(input: string, maxLen: number): string {
  return input
    .slice(0, maxLen)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[`${}\\]/g, '')
    .trim();
}

// Run image generation pipeline for an existing book record (after story_review)
async function runImagePipeline(bookId: string, skipImages: boolean): Promise<void> {
  const record = bookStore.get(bookId);
  if (!record) {
    progressTracker.setError(bookId, 'Book record not found');
    return;
  }

  try {
    let imageUrls: string[];
    if (skipImages) {
      imageUrls = record.pages.map(() => PLACEHOLDER_IMAGE);
    } else {
      progressTracker.setStep(bookId, 'images');
      imageUrls = await generateImages(record.pages, () => {
        progressTracker.incrementImages(bookId);
      });
    }

    let coverImageUrl: string;
    if (skipImages) {
      coverImageUrl = PLACEHOLDER_IMAGE;
    } else {
      progressTracker.setStep(bookId, 'cover');
      coverImageUrl = await generateCoverImage(record.coverImagePrompt ?? record.pages[0].imagePrompt);
    }

    bookStore.save({ ...record, imageUrls, coverImageUrl });
    progressTracker.setStep(bookId, 'done');
  } catch (err) {
    console.error('[runImagePipeline] Error:', err);
    progressTracker.setError(bookId, (err as Error).message ?? 'Image generation failed');
  }
}

// POST /api/generate — text generation spike
router.post('/generate', async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ text });
  } catch (err) {
    console.error('[/api/generate] Error:', err);
    res.status(500).json({ error: 'Gemini text generation failed' });
  }
});

// POST /api/generate-image — image generation spike
router.post('/generate-image', async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const genAI = getGeminiClient();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        // @ts-ignore — responseModalities not yet typed in SDK but required for image output
        responseModalities: ['Text', 'Image'],
      },
    });

    const result = await model.generateContent(prompt);
    const parts = result.response.candidates?.[0]?.content?.parts ?? [];

    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;
    let fallbackText: string | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType;
      }
      if (part.text) {
        fallbackText = part.text;
      }
    }

    if (imageBase64) {
      res.json({
        image: `data:${imageMimeType};base64,${imageBase64}`,
        mimeType: imageMimeType,
      });
    } else {
      console.warn('[/api/generate-image] No image in response, text fallback:', fallbackText?.slice(0, 100));
      res.status(501).json({
        error: 'Image generation returned no image. Check model availability or use imagen-3.0-generate-001.',
        textFallback: fallbackText,
      });
    }
  } catch (err) {
    console.error('[/api/generate-image] Error:', err);
    res.status(500).json({ error: 'Gemini image generation failed' });
  }
});

// POST /api/generate-story — story-only generation
router.post('/generate-story', async (req: Request, res: Response) => {
  const { childName, age, theme, moral, language: rawLanguage } = req.body as Partial<GenerateStoryRequest>;

  if (!childName || !age || !theme) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['childName', 'age', 'theme'],
    });
    return;
  }

  if (typeof age !== 'number' || age < 1 || age > 10) {
    res.status(400).json({ error: 'age must be a number between 1 and 10' });
    return;
  }

  const effectiveMoral = moral?.trim() || '재미있고 따뜻한 이야기';
  const validLanguages: Language[] = ['korean', 'english', 'bilingual'];
  const language: Language = (rawLanguage && validLanguages.includes(rawLanguage)) ? rawLanguage : 'korean';

  try {
    const result = await generateStory({ childName, age, theme, moral: effectiveMoral, language });
    res.json(result);
  } catch (err) {
    console.error('[/api/generate-story] Error:', err);
    res.status(500).json({ error: 'Story generation failed' });
  }
});

// POST /api/extract-child-features — Vision API: extract child appearance from photo
router.post('/extract-child-features', async (req: Request, res: Response) => {
  const { photoBase64 } = req.body as { photoBase64?: string };

  if (!photoBase64) {
    res.status(400).json({ error: 'photoBase64 is required' });
    return;
  }

  const base64Data = photoBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
      'Look at this child\'s photo and write a single compact English sentence describing their appearance for a 3D animation character: include approximate age, hair (color + style), eye color if visible, skin tone, and any distinctive accessories or clothing (e.g. glasses, hat). Format: "A [age]-year-old [ethnicity hint] [boy/girl] with [hair description], [eye description if visible], [skin tone], [accessories if any]." Output only the sentence, nothing else.',
    ]);

    const characterDescription = result.response.text().trim();
    res.json({ characterDescription });
  } catch (err) {
    console.error('[/api/extract-child-features] Error:', err);
    res.status(500).json({ error: 'Feature extraction failed' });
  }
});

// POST /api/generate-book — full pipeline: story → story_review pause → images + store
router.post('/generate-book', async (req: Request, res: Response) => {
  const { childName, age, theme, moral, skipImages, bookSpecUid: rawSpec, pageCount: rawPageCount, title: rawTitle, language: rawLanguage, characterAppearance } = req.body as Partial<GenerateStoryRequest> & { skipImages?: boolean };

  if (!childName || !age || !theme) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['childName', 'age', 'theme'],
    });
    return;
  }

  if (typeof age !== 'number' || age < 1 || age > 10) {
    res.status(400).json({ error: 'age must be a number between 1 and 10' });
    return;
  }

  const effectiveMoral = moral?.trim() || '재미있고 따뜻한 이야기';
  const bookSpecUid: BookSpecUid = (rawSpec && rawSpec in BOOK_SPECS) ? rawSpec : 'SQUAREBOOK_HC';
  const pageCount = (typeof rawPageCount === 'number' && rawPageCount >= 8 && rawPageCount <= 40) ? rawPageCount : 16;
  const validLanguages: Language[] = ['korean', 'english', 'bilingual'];
  const language: Language = (rawLanguage && validLanguages.includes(rawLanguage)) ? rawLanguage : 'korean';
  const bookId = generateId();

  const storyPageCount = Math.floor((pageCount - 2) / 2);

  progressTracker.start(bookId, storyPageCount);
  res.json({ bookId });

  const title = rawTitle?.trim() || undefined;
  const request: GenerateStoryRequest = { childName, age, theme, moral: effectiveMoral, bookSpecUid, pageCount, title, language, characterAppearance: characterAppearance?.trim() || undefined };

  try {
    // Step 1: Generate story text
    const storyResult = await generateStory(request);

    // Step 2: Save partial record and pause at story_review
    const partialBook: BookRecord = {
      id: bookId,
      title: storyResult.title,
      request,
      pages: storyResult.pages,
      imageUrls: [],
      coverImageUrl: '',
      bookSpecUid,
      createdAt: new Date().toISOString(),
      coverImagePrompt: storyResult.coverImagePrompt,
      characterDescription: storyResult.characterDescription,
    };
    bookStore.save(partialBook);
    progressTracker.setStep(bookId, 'story_review');

    // Image pipeline will be triggered by PATCH /api/generate-book/:id/story
    // Store skipImages preference so review page can pass it back
    progressTracker.setSkipImages(bookId, skipImages ?? false);
  } catch (err) {
    console.error('[/api/generate-book] Error:', err);
    progressTracker.setError(bookId, (err as Error).message ?? 'Generation failed');
  }
});

// POST /api/generate-book/:id/regenerate-story
// Regenerate all story pages based on a single user instruction
router.post('/generate-book/:id/regenerate-story', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { instruction } = req.body as { instruction?: string };

  if (!instruction?.trim()) {
    res.status(400).json({ error: 'instruction is required' });
    return;
  }

  const book = bookStore.get(id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const safeInstruction = sanitize(instruction, 300);
  const language = book.request.language ?? 'korean';
  const pageCount = book.pages.length;

  const currentStory = book.pages
    .map(p => `${p.pageNumber}페이지: ${p.text}`)
    .join('\n');

  const langNote = language === 'bilingual'
    ? 'Each page object must have "text" (Korean) and "textEn" (English).'
    : language === 'english'
      ? 'Each page object must have "text" (English).'
      : 'Each page object must have "text" (Korean).';

  const prompt = `You are editing a children's storybook.

Book: "${book.title}"
Character: ${book.request.childName} (age ${book.request.age})
Theme: ${book.request.theme}

Current story (${pageCount} pages):
${currentStory}

User instruction: ${safeInstruction}

Rewrite all ${pageCount} pages following the instruction. Keep the same story structure and age-appropriate language.
${langNote}

Return ONLY a valid JSON object:
{
  "title": "<book title>",
  "pages": [
    { "pageNumber": 1, "text": "...", "textEn": "..." },
    ...
  ]
}
Output only the JSON, no other text.`;

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text();

    const fenceMatch = raw.match(/```json?\n?([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1];

    const objStart = raw.indexOf('{');
    const objEnd = raw.lastIndexOf('}');
    if (objStart === -1 || objEnd === -1) throw new Error('No JSON found in Gemini response');
    raw = raw.slice(objStart, objEnd + 1).replace(/,\s*([\]}])/g, '$1');

    const parsed = JSON.parse(raw) as { title?: string; pages: Array<{ pageNumber: number; text: string; textEn?: string }> };

    if (!Array.isArray(parsed.pages)) {
      throw new Error('Gemini response missing pages array');
    }

    // Merge new text into existing pages (preserve imagePrompt and skipImage)
    // Accept any pages returned; fall back to original for missing indices
    const updatedPages: StoryPage[] = book.pages.map((page, i) => ({
      ...page,
      text: parsed.pages[i]?.text ?? page.text,
      textEn: parsed.pages[i]?.textEn ?? page.textEn,
    }));

    const updatedTitle = parsed.title?.trim() || book.title;

    res.json({ title: updatedTitle, pages: updatedPages });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[regenerate-story] Error:', message);
    res.status(500).json({ error: `Story regeneration failed: ${message}` });
  }
});

// GET /api/generate-book/:id/story — return story data for story_review step
router.get('/generate-book/:id/story', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = bookStore.get(id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  res.json({
    title: book.title,
    pages: book.pages,
    language: book.request.language ?? 'korean',
  });
});

// PATCH /api/generate-book/:id/story — apply edits and trigger image generation
router.patch('/generate-book/:id/story', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, pages, skipImages } = req.body as {
    title?: string;
    pages?: StoryPage[];
    skipImages?: boolean;
  };

  const book = bookStore.get(id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  let progress = progressTracker.get(id);
  // Recover from server restart: if progress is missing but book exists with pages and no images,
  // treat it as story_review state so the user can still trigger image generation.
  if (!progress && book.pages.length > 0 && book.imageUrls.length === 0) {
    progressTracker.start(id, book.pages.length);
    progressTracker.setStep(id, 'story_review');
    progress = progressTracker.get(id)!;
  }
  if (!progress || progress.step !== 'story_review') {
    res.status(409).json({ error: 'Book is not in story_review state' });
    return;
  }

  // Apply edits
  const updatedPages = (pages && pages.length > 0) ? pages : book.pages;
  const updatedTitle = title?.trim() || book.title;
  const effectiveSkipImages = skipImages ?? progressTracker.getSkipImages(id);

  // Count images to generate (pages without skipImage flag)
  const imagesToGenerate = updatedPages.filter(p => !p.skipImage).length;
  progressTracker.resetImages(id, imagesToGenerate);

  bookStore.save({ ...book, title: updatedTitle, pages: updatedPages });

  res.json({ ok: true });

  // Trigger image generation in background
  runImagePipeline(id, effectiveSkipImages);
});

// POST /api/generate-book/:id/pages/:pageNum/regenerate-text
// Regenerate a single page's story text based on user instruction
router.post('/generate-book/:id/pages/:pageNum/regenerate-text', async (req: Request, res: Response) => {
  const { id, pageNum } = req.params;
  const { instruction } = req.body as { instruction?: string };

  if (!instruction?.trim()) {
    res.status(400).json({ error: 'instruction is required' });
    return;
  }

  const book = bookStore.get(id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const pageIndex = book.pages.findIndex(p => p.pageNumber === Number(pageNum));
  if (pageIndex === -1) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const page = book.pages[pageIndex];
  const language = book.request.language ?? 'korean';
  const age = book.request.age;
  const childName = book.request.childName;

  const safeInstruction = sanitize(instruction, 200);

  const langNote = language === 'bilingual'
    ? 'Respond with JSON: {"text": "<Korean>", "textEn": "<English>"}'
    : language === 'english'
      ? 'Respond with JSON: {"text": "<English text>"}'
      : 'Respond with JSON: {"text": "<Korean text>"}';

  const prompt = `You are editing a children's storybook page.

Book: "${book.title}"
Character: ${childName} (age ${age})
Page ${pageNum} current text: "${page.text}"${language === 'bilingual' ? `\nCurrent English: "${page.textEn ?? ''}"` : ''}

User instruction: ${safeInstruction}

Rewrite this page's text following the instruction. Keep the same age-appropriate length and style.
${langNote}
Output only the JSON, no other text.`;

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text();

    const fenceMatch = raw.match(/```json?\n?([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1];

    const parsed = JSON.parse(raw) as { text: string; textEn?: string };

    res.json({ text: parsed.text, textEn: parsed.textEn });
  } catch (err) {
    console.error('[regenerate-text] Error:', err);
    res.status(500).json({ error: 'Text regeneration failed' });
  }
});

// POST /api/generate-book/:id/pages/:pageNum/regenerate-image-prompt
// Regenerate a single page's image prompt based on user instruction
router.post('/generate-book/:id/pages/:pageNum/regenerate-image-prompt', async (req: Request, res: Response) => {
  const { id, pageNum } = req.params;
  const { instruction } = req.body as { instruction?: string };

  if (!instruction?.trim()) {
    res.status(400).json({ error: 'instruction is required' });
    return;
  }

  const book = bookStore.get(id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const pageIndex = book.pages.findIndex(p => p.pageNumber === Number(pageNum));
  if (pageIndex === -1) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const page = book.pages[pageIndex];
  const safeInstruction = sanitize(instruction, 200);

  // Extract the scene description part (after the style seed prefix)
  const STYLE_SEED = "soft watercolor children's book illustration, pastel colors, no text no letters no words no numbers";
  const currentPrompt = page.imagePrompt;
  // Strip style seed and character description prefix to get the raw scene
  const seedIdx = currentPrompt.indexOf(STYLE_SEED);
  const scenePrompt = seedIdx !== -1
    ? currentPrompt.slice(seedIdx + STYLE_SEED.length).replace(/^,\s*/, '').replace(/^[^,]+,\s*/, '') // strip char chunk too
    : currentPrompt;

  const prompt = `You are editing an image prompt for a children's book illustration.

Current scene description: "${scenePrompt}"
Page text: "${page.text}"

User instruction: ${safeInstruction}

Rewrite the scene description for the illustration following the instruction.
Rules:
- English only
- Describe scene visually: characters, setting, action, mood
- Do NOT include style words (watercolor, pastel, etc.) — those are added automatically
- Do NOT include character appearance — that is added automatically
- Keep it concise (1-2 sentences)

Respond with JSON: {"imagePrompt": "<scene description>"}
Output only the JSON, no other text.`;

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text();

    const fenceMatch = raw.match(/```json?\n?([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1];

    const parsed = JSON.parse(raw) as { imagePrompt: string };

    // Re-prepend style seed + char chunk (same logic as storyGenerator)
    const STYLE_SEED_PREFIX = "soft watercolor children's book illustration, pastel colors, no text no letters no words no numbers";
    const charChunk = book.characterDescription ? book.characterDescription + ', ' : '';
    const fullPrompt = STYLE_SEED_PREFIX + ', ' + charChunk + parsed.imagePrompt;

    res.json({ imagePrompt: fullPrompt, sceneDescription: parsed.imagePrompt });
  } catch (err) {
    console.error('[regenerate-image-prompt] Error:', err);
    res.status(500).json({ error: 'Image prompt regeneration failed' });
  }
});

// POST /api/books/:id/pages/:pageNum/regenerate-image
// Regenerate a single page's actual image based on user instruction (post-generation)
router.post('/books/:id/pages/:pageNum/regenerate-image', async (req: Request, res: Response) => {
  const { id, pageNum } = req.params;
  const { instruction } = req.body as { instruction?: string };

  if (!instruction?.trim()) {
    res.status(400).json({ error: 'instruction is required' });
    return;
  }

  const book = bookStore.get(id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const pageIndex = book.pages.findIndex(p => p.pageNumber === Number(pageNum));
  if (pageIndex === -1) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const page = book.pages[pageIndex];
  const safeInstruction = sanitize(instruction, 200);

  // Step 1: Regenerate image prompt
  const STYLE_SEED = "soft watercolor children's book illustration, pastel colors, no text no letters no words no numbers";
  const currentPrompt = page.imagePrompt;
  const seedIdx = currentPrompt.indexOf(STYLE_SEED);
  const scenePrompt = seedIdx !== -1
    ? currentPrompt.slice(seedIdx + STYLE_SEED.length).replace(/^,\s*/, '').replace(/^[^,]+,\s*/, '')
    : currentPrompt;

  const promptRewritePrompt = `You are editing an image prompt for a children's book illustration.

Current scene description: "${scenePrompt}"
Page text: "${page.text}"

User instruction: ${safeInstruction}

Rewrite the scene description following the instruction.
Rules:
- English only
- Describe scene visually: characters, setting, action, mood
- Do NOT include style words or character appearance
- Keep it concise (1-2 sentences)

Respond with JSON: {"imagePrompt": "<scene description>"}
Output only the JSON, no other text.`;

  try {
    const genAI = getGeminiClient();

    const textModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const promptResult = await textModel.generateContent(promptRewritePrompt);
    let raw = promptResult.response.text();
    const fenceMatch = raw.match(/```json?\n?([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1];
    const parsed = JSON.parse(raw) as { imagePrompt: string };

    const charChunk = book.characterDescription ? book.characterDescription + ', ' : '';
    const fullPrompt = STYLE_SEED + ', ' + charChunk + parsed.imagePrompt;

    // Step 2: Actually generate the new image
    const imageModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        // @ts-ignore
        responseModalities: ['Text', 'Image'],
      },
    });

    const imageResult = await imageModel.generateContent(fullPrompt);
    const parts = imageResult.response.candidates?.[0]?.content?.parts ?? [];
    let imageUrl = PLACEHOLDER_IMAGE;
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    // Step 3: Save updated imageUrl + imagePrompt to book record
    const updatedPages = book.pages.map((p, i) =>
      i === pageIndex ? { ...p, imagePrompt: fullPrompt } : p
    );
    const updatedImageUrls = [...book.imageUrls];
    updatedImageUrls[pageIndex] = imageUrl;
    bookStore.save({ ...book, pages: updatedPages, imageUrls: updatedImageUrls });

    res.json({ imageUrl, pageIndex });
  } catch (err) {
    console.error('[regenerate-image] Error:', err);
    res.status(500).json({ error: 'Image regeneration failed' });
  }
});

// GET /api/generate-book/:id/status — poll generation progress
router.get('/generate-book/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;

  // If book is complete (has images), return done
  const book = bookStore.get(id);
  if (book && book.imageUrls.length > 0) {
    const total = book.pages.length;
    res.json({ step: 'done', imagesCompleted: total, totalImages: total });
    return;
  }

  const progress = progressTracker.get(id);
  if (!progress) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  res.json(progress);
});

// GET /api/books/:id — retrieve a generated book
router.get('/books/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = bookStore.get(id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  res.json(book);
});

export const generateRouter = router;
