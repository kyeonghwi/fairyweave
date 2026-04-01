import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateStory } from '../services/storyGenerator';
import { generateImages } from '../services/imageGenerator';
import { bookStore, generateId } from '../services/bookStore';
import type { GenerateStoryRequest, BookRecord } from '../types/story';

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

    console.log('[/api/generate] Gemini text response:', text.slice(0, 200));

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
      console.log('[/api/generate-image] Gemini image received, mimeType:', imageMimeType);
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
  const { childName, age, theme, moral } = req.body as Partial<GenerateStoryRequest>;

  // Validate required fields
  if (!childName || !age || !theme || !moral) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['childName', 'age', 'theme', 'moral'],
    });
    return;
  }

  if (typeof age !== 'number' || age < 1 || age > 12) {
    res.status(400).json({ error: 'age must be a number between 1 and 12' });
    return;
  }

  try {
    console.log(`[/api/generate-story] Generating story for ${childName} (age ${age}), theme: ${theme}`);
    const pages = await generateStory({ childName, age, theme, moral });
    console.log(`[/api/generate-story] Generated ${pages.length} pages`);
    res.json({ pages });
  } catch (err) {
    console.error('[/api/generate-story] Error:', err);
    res.status(500).json({ error: 'Story generation failed' });
  }
});

// POST /api/generate-book — full pipeline: story + images + store (Phase 2)
router.post('/generate-book', async (req: Request, res: Response) => {
  const { childName, age, theme, moral } = req.body as Partial<GenerateStoryRequest>;

  if (!childName || !age || !theme || !moral) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['childName', 'age', 'theme', 'moral'],
    });
    return;
  }

  if (typeof age !== 'number' || age < 1 || age > 12) {
    res.status(400).json({ error: 'age must be a number between 1 and 12' });
    return;
  }

  try {
    const request = { childName, age, theme, moral };
    console.log(`[/api/generate-book] Starting full pipeline for ${childName}`);

    // Step 1: Generate story text + image prompts
    console.log('[/api/generate-book] Step 1: Generating story...');
    const pages = await generateStory(request);
    console.log(`[/api/generate-book] Story generated: ${pages.length} pages`);

    // Step 2: Generate all 16 images in parallel
    console.log('[/api/generate-book] Step 2: Generating 16 images in parallel...');
    const imageUrls = await generateImages(pages);
    const successCount = imageUrls.filter(url => !url.startsWith('data:image/svg')).length;
    console.log(`[/api/generate-book] Images generated: ${successCount}/16 succeeded`);

    // Step 3: Store the book
    const bookId = generateId();
    const book: BookRecord = {
      id: bookId,
      request,
      pages,
      imageUrls,
      createdAt: new Date().toISOString(),
    };
    bookStore.save(book);
    console.log(`[/api/generate-book] Book saved with id: ${bookId}`);

    res.json({
      bookId,
      pages,
      imageUrls,
    });
  } catch (err) {
    console.error('[/api/generate-book] Error:', err);
    res.status(500).json({ error: 'Book generation failed' });
  }
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
