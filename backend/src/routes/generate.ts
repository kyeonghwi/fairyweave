import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateStory } from '../services/storyGenerator';
import { generateImages, generateCoverImage, PLACEHOLDER_IMAGE } from '../services/imageGenerator';
import { bookStore, generateId, progressTracker } from '../services/bookStore';
import type { GenerateStoryRequest, BookRecord, BookSpecUid, Language } from '../types/story';
import { BOOK_SPECS } from '../types/story';

const router = Router();

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
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
      // gemini-2.0-flash-exp returned text only — model may not support image output yet
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

// POST /api/generate-story — 16-page story generation pipeline (Phase 2)
router.post('/generate-story', async (req: Request, res: Response) => {
  const { childName, age, theme, moral, language: rawLanguage } = req.body as Partial<GenerateStoryRequest>;

  // Validate required fields (moral is optional — defaults to a fun story)
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

// POST /api/generate-book — full pipeline: story + images + store (Phase 2)
router.post('/generate-book', async (req: Request, res: Response) => {
  const { childName, age, theme, moral, skipImages, bookSpecUid: rawSpec, pageCount: rawPageCount, title: rawTitle, language: rawLanguage } = req.body as Partial<GenerateStoryRequest> & { skipImages?: boolean };

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

  // Return bookId immediately so frontend can start polling
  progressTracker.start(bookId, pageCount);
  res.json({ bookId });

  // Run pipeline in background
  const title = rawTitle?.trim() || undefined;
  const request = { childName, age, theme, moral: effectiveMoral, bookSpecUid, pageCount, title, language };

  try {
    // Step 1: Generate story (includes title + cover prompt)
    const storyResult = await generateStory(request);

    // Step 2: Generate content images (or use placeholders if skipped)
    let imageUrls: string[];
    if (skipImages) {
      imageUrls = storyResult.pages.map(() => PLACEHOLDER_IMAGE);
    } else {
      progressTracker.setStep(bookId, 'images');
      imageUrls = await generateImages(storyResult.pages, () => {
        progressTracker.incrementImages(bookId);
      });
    }

    // Step 3: Generate cover image
    let coverImageUrl: string;
    if (skipImages) {
      coverImageUrl = PLACEHOLDER_IMAGE;
    } else {
      progressTracker.setStep(bookId, 'cover');
      coverImageUrl = await generateCoverImage(storyResult.coverImagePrompt);
    }

    // Step 4: Store the book
    const book: BookRecord = {
      id: bookId,
      title: storyResult.title,
      request,
      pages: storyResult.pages,
      imageUrls,
      coverImageUrl,
      bookSpecUid,
      createdAt: new Date().toISOString(),
    };
    bookStore.save(book);
    progressTracker.setStep(bookId, 'done');
  } catch (err) {
    console.error('[/api/generate-book] Error:', err);
    progressTracker.setError(bookId, (err as Error).message ?? 'Generation failed');
  }
});

// GET /api/generate-book/:id/status — poll generation progress
router.get('/generate-book/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;

  // If book is already complete and stored, return done
  const book = bookStore.get(id);
  if (book) {
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
