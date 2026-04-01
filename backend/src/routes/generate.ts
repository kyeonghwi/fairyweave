import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    // Try gemini-2.0-flash-exp first (supports image generation via responseModalities)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
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

export const generateRouter = router;
