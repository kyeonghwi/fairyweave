export interface StoryPage {
  pageNumber: number;  // 1-16
  text: string;        // Story text for this page (Korean, or English in english-only mode)
  textEn?: string;     // English text (bilingual mode only)
  imagePrompt: string; // English image generation prompt with style seed included
}

export type BookSpecUid = 'SQUAREBOOK_HC' | 'PHOTOBOOK_A4_SC' | 'PHOTOBOOK_A5_SC';

export type Language = 'korean' | 'english' | 'bilingual';

export const BOOK_SPECS: Record<BookSpecUid, { name: string; minPages: number; maxPages: number }> = {
  SQUAREBOOK_HC:   { name: '정사각 하드커버 (243×248mm)', minPages: 24, maxPages: 130 },
  PHOTOBOOK_A4_SC: { name: 'A4 소프트커버 (210×297mm)',   minPages: 24, maxPages: 130 },
  PHOTOBOOK_A5_SC: { name: 'A5 소프트커버 (148×210mm)',   minPages: 50, maxPages: 200 },
};

export interface GenerateStoryRequest {
  childName: string;
  age: number;
  theme: string;       // e.g. "공룡", "우주", "마법"
  moral: string;       // e.g. "형제간의 우애", "편식 극복"
  bookSpecUid?: BookSpecUid;
  pageCount?: number;   // story pages to generate (default 16)
  title?: string;       // optional user-provided title; auto-generated if empty
  language?: Language;  // default: 'korean'
}

export interface GenerateStoryResult {
  title: string;
  pages: StoryPage[];
  coverImagePrompt: string; // English prompt for cover illustration
}

export interface BookRecord {
  id: string;
  title: string;
  request: GenerateStoryRequest;
  pages: StoryPage[];
  imageUrls: string[];      // base64 data URIs for content pages
  coverImageUrl: string;    // base64 data URI for cover illustration
  bookSpecUid: BookSpecUid;
  createdAt: string;
}

export interface GenerationProgress {
  step: 'story' | 'images' | 'cover' | 'done' | 'error';
  imagesCompleted: number;
  totalImages: number;
  reason?: string;
}
