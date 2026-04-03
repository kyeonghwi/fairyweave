import { GoogleGenerativeAI } from '@google/generative-ai';
import type { StoryPage } from '../types/story';

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBnZW5lcmF0aW9uIGZhaWxlZDwvdGV4dD48L3N2Zz4=';

const CONCURRENCY = 4;
const MAX_RETRIES = 2;

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateSingleImage(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  prompt: string,
  pageNum: number,
  totalPages: number,
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[imageGenerator] Generating image ${pageNum}/${totalPages}${attempt > 0 ? ` (retry ${attempt})` : ''}...`);
      const result = await model.generateContent(prompt);
      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error(`No image data in response for page ${pageNum}`);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < MAX_RETRIES) {
        const backoff = 1000 * Math.pow(2, attempt);
        console.warn(`[imageGenerator] Page ${pageNum} rate-limited (429), retrying in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Unreachable`);
}

export async function generateCoverImage(coverImagePrompt: string): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      // @ts-ignore — responseModalities not yet typed in SDK
      responseModalities: ['Text', 'Image'],
    },
  });

  try {
    return await generateSingleImage(model, coverImagePrompt, 0, 1);
  } catch (err) {
    console.warn('[imageGenerator] Cover image failed:', err);
    return PLACEHOLDER_IMAGE;
  }
}

export async function generateImages(
  pages: StoryPage[],
  onImageComplete?: () => void,
): Promise<string[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      // @ts-ignore — responseModalities not yet typed in SDK
      responseModalities: ['Text', 'Image'],
    },
  });

  const results: string[] = new Array(pages.length).fill(PLACEHOLDER_IMAGE);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < pages.length) {
      const i = nextIndex++;
      try {
        results[i] = await generateSingleImage(model, pages[i].imagePrompt, i + 1, pages.length);
      } catch (err) {
        console.warn(`[imageGenerator] Page ${i + 1} failed:`, err);
        results[i] = PLACEHOLDER_IMAGE;
      }
      onImageComplete?.();
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, pages.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
