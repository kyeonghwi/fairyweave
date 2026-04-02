import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerateStoryRequest, StoryPage } from '../types/story';

const STYLE_SEED = "soft watercolor children's book illustration, pastel colors";

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateStory(req: GenerateStoryRequest): Promise<StoryPage[]> {
  const prompt = `You are a professional children's book author and illustrator prompt engineer.

Create a 16-page children's storybook for a child named "${req.childName}" (age ${req.age}).
Theme: ${req.theme}
Moral/Lesson: ${req.moral}

RULES:
- Return ONLY a valid JSON array with exactly 16 objects
- Each object has exactly 3 fields: "pageNumber" (integer 1-16), "text" (Korean story text, 2-3 sentences per page), "imagePrompt" (English image description for illustration)
- Story structure: Page 1 = introduction of ${req.childName}, Pages 2-14 = adventure with rising tension, Page 15 = climax, Page 16 = resolution reflecting the moral
- The child ${req.childName} must be the main character in every scene
- imagePrompt must describe the scene visually in English (characters, setting, action, mood) — do NOT include style instructions, they will be added automatically
- text must be in Korean, written for a ${req.age}-year-old child
- Do NOT wrap the JSON in markdown code fences or add any other text

JSON array:`;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();

  // Strip markdown code fences if present
  const fenceMatch = responseText.match(/```json?\n?([\s\S]*?)```/);
  if (fenceMatch) {
    responseText = fenceMatch[1];
  }

  // Extract the outermost JSON array
  const arrStart = responseText.indexOf('[');
  const arrEnd = responseText.lastIndexOf(']');
  if (arrStart === -1 || arrEnd === -1) {
    throw new Error('No JSON array found in Gemini response');
  }
  let jsonStr = responseText.slice(arrStart, arrEnd + 1);

  // Repair common LLM JSON issues: trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  let pages: StoryPage[];
  try {
    pages = JSON.parse(jsonStr);
  } catch (e) {
    console.error('[generateStory] JSON parse failed after repair. Raw response (first 500 chars):', responseText.slice(0, 500));
    throw new Error(`Failed to parse Gemini story response: ${(e as Error).message}`);
  }

  if (!Array.isArray(pages) || pages.length !== 16) {
    throw new Error(`Expected 16 pages but got ${Array.isArray(pages) ? pages.length : 'non-array'}`);
  }

  // Prepend style seed to every imagePrompt (AI-03)
  for (const page of pages) {
    page.imagePrompt = STYLE_SEED + ", " + page.imagePrompt;
  }

  return pages;
}
