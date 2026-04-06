import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerateStoryRequest, StoryPage, GenerateStoryResult, Language } from '../types/story';

const STYLE_SEED = "soft watercolor children's book illustration, pastel colors, no text no letters no words no numbers";

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
    .replace(/[\x00-\x1F\x7F]/g, '') // strip control chars
    .replace(/[`${}\\]/g, '')          // strip template/escape chars
    .trim();
}

function getAgeBasedTextInstruction(age: number): string {
  if (age <= 3) return '1-2 very short sentences, using extremely simple vocabulary and repetitive sounds (onomatopoeia/mimetic words)';
  if (age <= 6) return '2-3 sentences, using engaging words and clear narrative suitable for kindergarteners';
  if (age <= 9) return '3-5 sentences, adding descriptive adjectives, emotional depth, and cause-and-effect relationships';
  return '4-6 sentences, with a slightly more complex plot, moral dilemmas, and rich vocabulary (maximum age level 10)';
}

function getLanguageInstructions(language: Language, childAge: number): string {
  const textInstruction = getAgeBasedTextInstruction(childAge);
  switch (language) {
    case 'english':
      return `- text must be in English, written for a ${childAge}-year-old child (${textInstruction})
- "title": string -- the book title in English`;
    case 'bilingual':
      return `- Each page object must have TWO text fields:
  - "text": Korean story text (${textInstruction})
  - "textEn": English story text (same length guideline, same meaning as Korean)
- "title": string -- the book title in Korean
- Generate BOTH languages for every page simultaneously`;
    case 'korean':
    default:
      return `- text must be in Korean, written for a ${childAge}-year-old child (${textInstruction})
- "title": string -- the book title in Korean`;
  }
}

export async function generateStory(req: GenerateStoryRequest): Promise<GenerateStoryResult> {
  const childName = sanitize(req.childName, 20);
  const theme = sanitize(req.theme, 30);
  const moral = sanitize(req.moral, 100);
  const userTitle = req.title ? sanitize(req.title, 50) : '';
  const totalPages = req.pageCount ?? 16;
  const language: Language = req.language ?? 'korean';

  // Real book: totalPages includes cover + back cover
  // Inner pages = totalPages - 2, each spread = 1 image page + 1 text page
  const pageCount = Math.floor((totalPages - 2) / 2);
  const climaxPage = pageCount - 1;
  const bodyEnd = pageCount - 2;

  const titleLang = language === 'english' ? 'English' : 'Korean';
  const titleInstruction = userTitle
    ? `The book title is "${userTitle}". Build the story around this title.`
    : `Generate a creative, charming ${titleLang} book title that fits the story.`;

  const prompt = `You are a professional children's book author and illustrator prompt engineer.

Create a ${pageCount}-page children's storybook for a child named "${childName}" (age ${req.age}).
Theme: ${theme}
Moral/Lesson: ${moral}
${titleInstruction}

RULES:
- Return ONLY a valid JSON object (NOT an array) with these fields:
  - "title": string — the book title
  - "coverImagePrompt": string — English image description for the book cover illustration (the main character in a key scene, eye-catching composition)
  - "pages": array of exactly ${pageCount} objects, each with: "pageNumber" (integer 1-${pageCount}), "text" (story text, length per age guidelines below)${language === 'bilingual' ? ', "textEn" (same story in English, same length)' : ''}, "imagePrompt" (English image description for illustration)
- Story structure: Page 1 = introduction of ${childName}, Pages 2-${bodyEnd} = adventure with rising tension, Page ${climaxPage} = climax, Page ${pageCount} = resolution reflecting the moral
- The child ${childName} must be the main character in every scene
- imagePrompt and coverImagePrompt must describe scenes visually in English (characters, setting, action, mood) — do NOT include style instructions, they will be added automatically
- coverImagePrompt should be a visually striking, cover-worthy scene that represents the whole story
- ${getLanguageInstructions(language, req.age)}
- Do NOT wrap the JSON in markdown code fences or add any other text

JSON object:`;

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

  // Extract the outermost JSON object
  const objStart = responseText.indexOf('{');
  const objEnd = responseText.lastIndexOf('}');
  if (objStart === -1 || objEnd === -1) {
    throw new Error('No JSON object found in Gemini response');
  }
  let jsonStr = responseText.slice(objStart, objEnd + 1);

  // Repair common LLM JSON issues: trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  let parsed: { title?: string; coverImagePrompt?: string; pages?: StoryPage[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error('[generateStory] JSON parse failed after repair. Raw response (first 500 chars):', responseText.slice(0, 500));
    throw new Error(`Failed to parse Gemini story response: ${(e as Error).message}`);
  }

  const pages = parsed.pages;
  if (!Array.isArray(pages) || pages.length !== pageCount) {
    throw new Error(`Expected ${pageCount} pages but got ${Array.isArray(pages) ? pages.length : 'non-array'}`);
  }

  if (language === 'bilingual') {
    for (const page of pages) {
      if (!page.textEn) {
        // Fallback: if Gemini didn't return textEn, copy text as-is
        page.textEn = page.text;
      }
    }
  }

  const title = parsed.title || userTitle || `${childName}의 동화책`;
  const coverImagePrompt = STYLE_SEED + ", " + (parsed.coverImagePrompt || pages[0].imagePrompt);

  // Prepend style seed to every imagePrompt (AI-03)
  for (const page of pages) {
    page.imagePrompt = STYLE_SEED + ", " + page.imagePrompt;
  }

  return { title, pages, coverImagePrompt };
}
