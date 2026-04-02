export interface DummyPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
}

export interface DummyBook {
  id: string;
  title: string;
  theme: string;
  themeEmoji: string;
  themeColor: string;
  childName: string;
  age: number;
  moral: string;
  pages: DummyPage[];
  imageUrls: string[];
  coverImageUrl: string;
}

// Generate placeholder SVG data URI (use encodeURIComponent for Unicode safety)
function placeholderSvg(color: string, pageNum: number, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${color}"/><text x="512" y="480" text-anchor="middle" font-size="200" fill="white" opacity="0.2" font-weight="bold">${pageNum}</text><text x="820" y="920" text-anchor="middle" font-size="120" opacity="0.3">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function coverSvg(color: string, title: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${color}"/><text x="512" y="380" text-anchor="middle" font-size="180" opacity="0.9">${emoji}</text><text x="512" y="580" text-anchor="middle" font-size="64" fill="#2D2D2D" font-weight="bold">${title}</text><text x="512" y="660" text-anchor="middle" font-size="36" fill="#5C5C5C">FairyWeave</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const themes = [
  { name: '공룡', emoji: '🦕', color: '#FFE4A1' },
  { name: '우주', emoji: '🚀', color: '#87CEEB' },
  { name: '마법', emoji: '🧙', color: '#D4B8E0' },
  { name: '바다', emoji: '🌊', color: '#7EC8E3' },
  { name: '숲',  emoji: '🌲', color: '#A8E6CF' },
];

const bookData: { childName: string; age: number; moral: string; stories: string[] }[] = [
  {
    childName: '하늘',
    age: 5,
    moral: '용기를 내면 새로운 친구를 만날 수 있어요',
    stories: [
      '옛날 옛적, 하늘이라는 아이가 살았어요. 하늘이는 공룡을 정말 좋아했답니다.',
      '어느 날 하늘이는 뒷산에서 반짝이는 알을 발견했어요. "이건 뭘까?"',
      '알에서 작은 아기 공룡이 태어났어요! 초록색 눈이 반짝반짝 빛났답니다.',
      '하늘이는 아기 공룡에게 "또리"라는 이름을 지어주었어요.',
      '또리는 하늘이를 따라 다니며 꼬리를 살랑살랑 흔들었어요.',
      '어느 날 숲속에서 길을 잃은 아기 새를 발견했어요.',
      '하늘이와 또리는 함께 아기 새의 집을 찾아주기로 했어요.',
      '높은 나무 위, 아기 새의 둥지를 찾았어요! 엄마 새가 기뻐했답니다.',
      '돌아오는 길에 비가 내리기 시작했어요. 또리가 큰 잎으로 우산을 만들어줬어요.',
      '비가 그치고 무지개가 떴어요. 하늘이와 또리는 감탄했답니다.',
      '"또리야, 우리 항상 함께 하자!" 하늘이가 말했어요.',
      '또리는 고개를 끄덕이며 하늘이의 손을 핥아줬어요.',
      '그날 밤, 하늘이는 또리와 함께 별을 보며 잠이 들었어요.',
      '다음 날 아침, 또리가 깜짝 선물을 준비했어요. 예쁜 꽃다발이었답니다!',
      '하늘이는 세상에서 가장 특별한 친구를 만난 거예요.',
      '하늘이와 또리의 모험은 이제 시작이랍니다. 끝.',
    ],
  },
  {
    childName: '서준',
    age: 6,
    moral: '꿈을 포기하지 않으면 반드시 이루어져요',
    stories: [
      '서준이는 밤마다 별을 보며 우주 비행사의 꿈을 꿨어요.',
      '어느 날 밤, 창문으로 작은 우주선이 날아왔어요! "타고 싶니?" 목소리가 들렸어요.',
      '서준이는 용기를 내어 우주선에 올라탔어요. 안에는 로봇 친구 삐삐가 있었답니다.',
      '"자, 출발!" 우주선이 하늘 높이 날아올랐어요.',
      '달나라에 도착했어요. 달 위에서 토끼가 떡을 만들고 있었답니다.',
      '"안녕, 서준아! 떡 먹을래?" 달 토끼가 물었어요.',
      '맛있는 떡을 먹고 화성으로 출발! 빨간 모래가 반짝였어요.',
      '화성에서 외계인 친구 뿌뿌를 만났어요. 뿌뿌는 춤추기를 좋아했답니다.',
      '다 함께 별의 바다를 건넜어요. 수많은 별들이 물고기처럼 헤엄쳤어요.',
      '토성의 고리 위에서 미끄럼을 탔어요. 정말 신나는 모험이었답니다!',
      '우주 정거장에서 진짜 우주 비행사들을 만났어요.',
      '"서준아, 넌 훌륭한 우주 비행사가 될 거야!" 선장님이 말했어요.',
      '삐삐와 함께 은하수를 건너 집으로 돌아왔어요.',
      '창밖으로 해가 떠오르고 있었어요. "꿈이었을까?"',
      '서준이의 베개 옆에 삐삐가 준 별 모양 배지가 놓여 있었어요.',
      '서준이는 미소 지으며 말했어요. "나는 꼭 우주 비행사가 될 거야!" 끝.',
    ],
  },
  {
    childName: '지유',
    age: 4,
    moral: '마음을 담으면 마법이 일어나요',
    stories: [
      '지유는 그림 그리기를 좋아하는 아이였어요.',
      '어느 날 할머니가 신비한 크레용 세트를 선물해 주셨어요.',
      '분홍 크레용으로 나비를 그렸더니, 나비가 진짜로 날아올랐어요!',
      '"어머나!" 지유는 깜짝 놀랐지만 너무 신이 났답니다.',
      '초록 크레용으로 커다란 나무를 그렸어요. 나무에서 달콤한 과일이 열렸답니다.',
      '파란 크레용으로 강을 그렸어요. 물고기들이 튀어나와 인사했어요.',
      '지유는 노란 크레용으로 태양을 그렸어요. 방이 따뜻해졌답니다.',
      '보라 크레용으로 성을 그렸어요. 아름다운 마법의 성이 나타났어요!',
      '성 안에서 마법사 할아버지를 만났어요. "잘 왔구나, 지유야!"',
      '"이 크레용은 마음을 담아 그리면 마법이 일어난단다."',
      '지유는 아픈 친구를 위해 꽃을 그려 선물했어요.',
      '친구가 웃으며 말했어요. "고마워 지유야, 기분이 좋아졌어!"',
      '지유는 가족을 위해 무지개를 그렸어요. 온 가족이 함께 웃었답니다.',
      '마법사 할아버지가 말했어요. "가장 큰 마법은 사랑이란다."',
      '지유는 크레용으로 하트를 그렸어요. 세상이 더 따뜻해졌답니다.',
      '지유의 마법 크레용 이야기는 계속됩니다. 끝.',
    ],
  },
  {
    childName: '도윤',
    age: 7,
    moral: '바다처럼 넓은 마음을 가져요',
    stories: [
      '도윤이는 바다 근처에 사는 아이였어요. 파도 소리가 자장가였답니다.',
      '어느 여름날, 해변에서 반짝이는 조개를 주웠어요.',
      '조개를 귀에 대니 "도윤아, 바다 속으로 놀러 올래?" 하는 목소리가 들렸어요.',
      '도윤이가 바다에 발을 담그자, 꼬리가 생겼어요! 인어가 된 거예요.',
      '산호초 마을에 도착했어요. 알록달록한 물고기 친구들이 반겨줬답니다.',
      '니모라는 물고기가 도윤이에게 바다 마을을 안내해 줬어요.',
      '바다 학교에서는 고래 선생님이 노래를 가르치고 있었어요.',
      '갑자기 바다가 어두워졌어요. 쓰레기가 산호초를 덮고 있었답니다.',
      '도윤이와 친구들은 함께 바다 청소를 시작했어요.',
      '해파리 아줌마, 거북이 할아버지도 도와주었답니다.',
      '드디어 바다가 깨끗해졌어요! 산호초가 다시 알록달록 빛났어요.',
      '"고마워, 도윤아!" 바다 친구들이 환호했어요.',
      '해마 왕이 도윤이에게 진주 목걸이를 선물해 줬어요.',
      '해가 질 무렵, 도윤이는 해변으로 돌아왔어요.',
      '손에는 빛나는 진주 목걸이가 남아 있었답니다.',
      '도윤이는 바다를 바라보며 약속했어요. "바다야, 꼭 지켜줄게!" 끝.',
    ],
  },
  {
    childName: '은서',
    age: 5,
    moral: '자연을 사랑하면 자연도 우리를 사랑해요',
    stories: [
      '은서는 숲 근처에 사는 호기심 많은 아이였어요.',
      '어느 봄날, 숲에서 작은 다람쥐가 은서에게 도토리를 건넸어요.',
      '"따라와!" 다람쥐가 손짓했어요. 은서는 다람쥐를 따라 깊은 숲으로 들어갔답니다.',
      '숲의 요정들이 은서를 맞이했어요. 나뭇잎 옷을 입은 귀여운 요정들이었답니다.',
      '"은서야, 숲에 봄이 오게 도와줄 수 있니?" 요정 대장이 물었어요.',
      '은서는 고개를 끄덕였어요. 첫 번째 임무는 씨앗 심기였답니다.',
      '은서가 심은 씨앗에서 꽃이 활짝 피었어요! 나비들이 날아왔답니다.',
      '두 번째 임무는 시냇물 길 만들기. 물이 졸졸 흐르기 시작했어요.',
      '물가에서 개구리 합창단이 노래를 불렀어요. "개굴개굴~"',
      '세 번째 임무는 새들의 집 짓기. 은서가 나뭇가지를 모아 예쁜 둥지를 만들었어요.',
      '아기 새들이 둥지에 앉아 기뻐했답니다.',
      '숲이 봄으로 가득 채워졌어요! 꽃향기가 솔솔 풍겼답니다.',
      '"고마워, 은서야!" 모든 동물 친구들이 인사했어요.',
      '요정 대장이 은서에게 빛나는 도토리 목걸이를 선물해 줬어요.',
      '은서는 집으로 돌아와 창밖을 바라봤어요. 숲이 반짝이고 있었답니다.',
      '은서와 숲 친구들의 이야기는 매 계절마다 이어진답니다. 끝.',
    ],
  },
];

export const dummyBooks: DummyBook[] = bookData.map((data, idx) => {
  const theme = themes[idx];
  const pages: DummyPage[] = data.stories.map((text, i) => ({
    pageNumber: i + 1,
    text,
    imagePrompt: `Illustration for page ${i + 1} of a children's storybook about ${theme.name}`,
  }));

  const imageUrls = pages.map((p) => placeholderSvg(theme.color, p.pageNumber, theme.emoji));
  const cover = coverSvg(theme.color, `${data.childName}의 ${theme.emoji}${theme.name} 모험`, theme.emoji);

  return {
    id: `dummy-${idx + 1}`,
    title: `${data.childName}의 ${theme.name} 모험`,
    theme: `${theme.emoji} ${theme.name}`,
    themeEmoji: theme.emoji,
    themeColor: theme.color,
    childName: data.childName,
    age: data.age,
    moral: data.moral,
    pages,
    imageUrls,
    coverImageUrl: cover,
  };
});

export function getDummyBook(id: string): DummyBook | undefined {
  return dummyBooks.find((b) => b.id === id);
}
