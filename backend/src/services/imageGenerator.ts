import { GoogleGenerativeAI } from '@google/generative-ai';
import type { StoryPage } from '../types/story';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBnZW5lcmF0aW9uIGZhaWxlZDwvdGV4dD48L3N2Zz4=';

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateImages(pages: StoryPage[]): Promise<string[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      // @ts-ignore — responseModalities not yet typed in SDK
      responseModalities: ['Text', 'Image'],
    },
  });

  const results = await Promise.allSettled(
    pages.map(async (page, index) => {
      console.log(`[imageGenerator] Generating image ${index + 1}/${pages.length}...`);
      const result = await model.generateContent(page.imagePrompt);
      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error(`No image data in response for page ${page.pageNumber}`);
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.warn(`[imageGenerator] Page ${index + 1} failed:`, result.reason);
    return PLACEHOLDER_IMAGE;
  });
}
