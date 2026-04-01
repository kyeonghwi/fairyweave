export interface StoryPage {
  pageNumber: number;  // 1-16
  text: string;        // Story text for this page (Korean)
  imagePrompt: string; // English image generation prompt with style seed included
}

export interface GenerateStoryRequest {
  childName: string;
  age: number;
  theme: string;       // e.g. "공룡", "우주", "마법"
  moral: string;       // e.g. "형제간의 우애", "편식 극복"
}

export interface GenerateStoryResponse {
  pages: StoryPage[];
}

export interface BookRecord {
  id: string;
  request: GenerateStoryRequest;
  pages: StoryPage[];
  imageUrls: string[];  // base64 data URIs after image generation
  createdAt: string;
}
