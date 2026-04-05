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

export const dummyBooks: DummyBook[] = [
  {
    id: 'dummy-1',
    title: '작은 우주비행사 하늘이',
    theme: '🚀 우주 여행',
    themeEmoji: '🚀',
    themeColor: '#87CEEB',
    childName: '하늘',
    age: 5,
    moral: '용기와 다정한 마음만 있다면 어디든 갈 수 있어요',
    pages: [
      { pageNumber: 1, text: '하늘이는 매일 밤 반짝이는 별을 보며 우주비행사를 꿈꿨어요. "언젠가 저 별에 꼭 닿고 말 테야!"', imagePrompt: 'A cute child looking up at stars from bedroom window, dreaming of being an astronaut, warm cozy room, 3D Pixar style' },
      { pageNumber: 2, text: '은빛 우주선을 타고 푸른 지구를 떠나 까만 우주로 날아올랐어요. 무중력 우주선 안에서 몸이 둥둥 떠다녔죠.', imagePrompt: 'A child astronaut floating inside a silver spaceship leaving Earth, zero gravity, 3D Pixar style' },
      { pageNumber: 3, text: '커다란 목성과 아름다운 얼음 고리를 가진 토성을 쌩하고 지나갔어요. "우와, 우주는 정말 크고 멋진 곳이야!"', imagePrompt: 'A spaceship flying past Jupiter and Saturn with ice rings, colorful planets, 3D Pixar style' },
      { pageNumber: 4, text: '그때, 길을 잃고 훌쩍이는 꼬마 별똥별 친구를 만났어요. "울지 마, 내가 길을 찾아줄게." 하늘이가 다정하게 말했어요.', imagePrompt: 'A child astronaut comforting a small crying shooting star character in space, 3D Pixar style' },
      { pageNumber: 5, text: '하늘이는 우주선의 반짝이는 불빛으로 꼬마 별똥별을 은하수 마을까지 안전하게 데려다주었어요.', imagePrompt: 'A spaceship guiding a small star through the Milky Way to a village of stars, magical, 3D Pixar style' },
      { pageNumber: 6, text: '은하수 마을의 별들은 고맙다며 하늘이에게 가장 밝게 빛나는 \'용기의 별 배지\'를 달아주었답니다.', imagePrompt: 'Stars in a galaxy village pinning a glowing badge on a child astronaut, celebration, 3D Pixar style' },
      { pageNumber: 7, text: '지구로 무사히 돌아온 하늘이는 환하게 웃었어요. "용기와 다정한 마음만 있다면 어디든 갈 수 있어!"', imagePrompt: 'A happy child astronaut back on Earth looking at the night sky with a glowing badge, 3D Pixar style' },
    ],
    imageUrls: Array.from({ length: 7 }, () => '/images/astronaut-cover.jpg'),
    coverImageUrl: '/images/astronaut-cover.jpg',
  },
  {
    id: 'dummy-2',
    title: '숲속 친구들의 비밀 파티',
    theme: '🌲 숲속 친구들',
    themeEmoji: '🌲',
    themeColor: '#A8E6CF',
    childName: '꼼지',
    age: 5,
    moral: '서로 나누고 배려하는 시간은 정말 행복해요',
    pages: [
      { pageNumber: 1, text: '햇살이 따스한 숲속 마을에 즐거운 아침이 밝았어요. 아기 곰 꼼지가 친구들을 위해 몰래 비밀 파티를 준비했죠.', imagePrompt: 'A cute baby bear preparing a secret party in a sunlit forest village, 3D Pixar style' },
      { pageNumber: 2, text: '예쁜 나뭇잎으로 초대장을 만들어 숲속 곳곳에 띄워 보냈어요. "친구들이 파티를 좋아했으면 좋겠어!"', imagePrompt: 'A baby bear sending leaf invitations floating through the forest, 3D Pixar style' },
      { pageNumber: 3, text: '다람쥐는 도토리를, 토끼는 달콤한 산딸기를 한가득 안고 찾아왔어요. "우와, 정말 맛있는 냄새가 나!"', imagePrompt: 'A squirrel with acorns and a bunny with berries arriving at a forest party, 3D Pixar style' },
      { pageNumber: 4, text: '아기 새들은 나뭇가지에 앉아 고운 목소리로 파티 축하 노래를 짹짹 불러주었어요. 숲속이 왁자지껄해졌죠.', imagePrompt: 'Baby birds singing on tree branches at a forest party celebration, 3D Pixar style' },
      { pageNumber: 5, text: '친구들은 커다란 버섯 식탁에 둘러앉아 각자 가져온 음식을 나누어 먹었어요. 함께 먹으니 맛과 기쁨이 두 배가 되었어요.', imagePrompt: 'Forest animals sharing food around a giant mushroom table, 3D Pixar style' },
      { pageNumber: 6, text: '배불리 먹은 숲속 친구들은 손을 잡고 빙글빙글 돌며 신나게 춤을 추었어요. 웃음소리가 숲속 가득 울려 퍼졌어요.', imagePrompt: 'Forest animals dancing in a circle holding hands, joyful, 3D Pixar style' },
      { pageNumber: 7, text: '붉은 노을이 질 무렵, 친구들은 서로 꼭 안아주며 인사했어요. 서로 나누고 배려하는 시간은 정말 행복했답니다.', imagePrompt: 'Forest animals hugging each other at sunset, warm golden light, 3D Pixar style' },
    ],
    imageUrls: Array.from({ length: 7 }, () => '/images/forest-cover.jpg'),
    coverImageUrl: '/images/forest-cover.jpg',
  },
  {
    id: 'dummy-3',
    title: '구름 타고 둥둥 꿈나라로',
    theme: '☁️ 잠자리 동화',
    themeEmoji: '☁️',
    themeColor: '#C4B5FD',
    childName: '아이',
    age: 4,
    moral: '잘 자, 내일 또 신나게 놀자',
    pages: [
      { pageNumber: 1, text: '깜깜한 밤이 찾아오자, 노란 달님이 부드럽게 창문을 두드렸어요. "이제 포근한 꿈나라로 떠날 시간이야."', imagePrompt: 'A yellow crescent moon gently tapping a bedroom window at night, 3D Pixar style' },
      { pageNumber: 2, text: '창문 밖에서 솜사탕처럼 푹신푹신한 아기 구름이 두둥실 날아왔어요. 구름 위에 눕자 온몸이 사르르 녹는 것 같았죠.', imagePrompt: 'A child lying on a soft marshmallow cloud floating outside the window, 3D Pixar style' },
      { pageNumber: 3, text: '구름은 밤하늘 위로 천천히 솟아올랐어요. 발아래로 반짝이는 마을의 불빛들이 장난감처럼 작게 보였어요.', imagePrompt: 'A cloud rising into the night sky with tiny village lights below, 3D Pixar style' },
      { pageNumber: 4, text: '은하수 강가를 지날 때, 찰랑거리는 별빛 물고기들이 수면 위로 폴짝폴짝 뛰며 반갑게 인사해주었어요.', imagePrompt: 'Starlight fish jumping out of a Milky Way river, sparkling, 3D Pixar style' },
      { pageNumber: 5, text: '밤하늘의 예쁜 별님들이 자장가를 부르며 반짝반짝 빛나주었어요. 시원한 바람은 머리카락을 부드럽게 쓰다듬어 주었답니다.', imagePrompt: 'Stars singing lullabies in the night sky, gentle breeze, 3D Pixar style' },
      { pageNumber: 6, text: '달콤한 별사탕 비가 보슬보슬 내리는 은하수 마을에 도착하자, 스르르 크게 하품이 나왔어요.', imagePrompt: 'A child yawning on a cloud arriving at a candy star rain galaxy village, 3D Pixar style' },
      { pageNumber: 7, text: '두 눈이 무겁게 감기고 세상에서 제일 편안한 꿈이 시작되었어요. "잘 자, 내일 또 신나게 놀자."', imagePrompt: 'A child peacefully sleeping on a cloud under a smiling moon, 3D Pixar style' },
    ],
    imageUrls: Array.from({ length: 7 }, () => '/images/cloud-cover.jpg'),
    coverImageUrl: '/images/cloud-cover.jpg',
  },
  {
    id: 'dummy-4',
    title: '바다 탐험대, 뽀글뽀글 보물찾기',
    theme: '🌊 바다 모험',
    themeEmoji: '🌊',
    themeColor: '#7EC8E3',
    childName: '탐험대',
    age: 5,
    moral: '가장 큰 보물은 바다에서 만난 멋진 친구들이에요',
    pages: [
      { pageNumber: 1, text: '노란 잠수함을 타고 깊고 푸른 바다로 신나는 모험을 떠났어요. "과연 바닷속에는 어떤 비밀이 숨어있을까?"', imagePrompt: 'A child in a yellow submarine diving into deep blue ocean, 3D Pixar style' },
      { pageNumber: 2, text: '창밖으로 알록달록한 산호초와 예쁜 줄무늬 물고기들이 이리저리 헤엄치며 인사를 건넸어요.', imagePrompt: 'Colorful coral reef with striped fish swimming outside a submarine window, 3D Pixar style' },
      { pageNumber: 3, text: '꼬마 거북이가 엉금엉금 다가와 숨겨진 길을 알려주었어요. "나를 따라와, 커다란 조개껍데기 성 뒤에 있어!"', imagePrompt: 'A cute baby turtle guiding a submarine to a hidden path behind a shell castle, 3D Pixar style' },
      { pageNumber: 4, text: '길을 가다 문어 아저씨의 먹물 미로에 갇히기도 했지만, 요리조리 지혜롭게 잘 빠져나왔어요.', imagePrompt: 'A submarine navigating through an octopus ink maze underwater, 3D Pixar style' },
      { pageNumber: 5, text: '커다란 고래 아저씨에게 손을 흔들며 어두운 바다 동굴을 씩씩하게 지나갔어요. 마침내 반짝반짝 빛나는 진주 보물상자를 발견했죠!', imagePrompt: 'A child waving at a whale near a dark sea cave with a glowing treasure chest, 3D Pixar style' },
      { pageNumber: 6, text: '상자 안에는 바다 친구들과 함께 가지고 놀 수 있는 신기한 물방울 장난감들이 가득 들어있었어요.', imagePrompt: 'An open treasure chest full of magical water bubble toys underwater, 3D Pixar style' },
      { pageNumber: 7, text: '하지만 가장 큰 보물은 바다에서 만난 멋진 친구들이었어요. 호기심으로 가득했던 바다 탐험은 대성공이었답니다.', imagePrompt: 'A child surrounded by ocean friends - turtle, fish, whale - celebrating together, 3D Pixar style' },
    ],
    imageUrls: Array.from({ length: 7 }, () => '/images/ocean-cover.jpg'),
    coverImageUrl: '/images/ocean-cover.jpg',
  },
  {
    id: 'dummy-5',
    title: '사계절 요정의 비밀 정원',
    theme: '🧚 마법 정원',
    themeEmoji: '🧚',
    themeColor: '#D4B8E0',
    childName: '아이',
    age: 5,
    moral: '계절마다 아름답게 옷을 갈아입는 자연은 정말 마법 같아요',
    pages: [
      { pageNumber: 1, text: '낡은 나무 문을 열자 사계절 요정들이 반갑게 인사했어요. 이 신비한 정원은 하루 만에 사계절이 모두 지나가요.', imagePrompt: 'A child opening an old wooden door to a magical garden with four season fairies, 3D Pixar style' },
      { pageNumber: 2, text: '봄 요정이 지팡이를 톡톡 두드리자 새싹이 돋고 향기로운 꽃이 피어났어요. 예쁜 나비들이 팔랑팔랑 날아왔죠.', imagePrompt: 'A spring fairy tapping her wand making flowers bloom and butterflies appear, 3D Pixar style' },
      { pageNumber: 3, text: '여름 요정은 시원한 소나기를 뿌려 나무를 쑥쑥 키워주었어요. 초록색 매미들이 맴맴 즐거운 노래를 불렀어요.', imagePrompt: 'A summer fairy creating rain to grow trees with cicadas singing, lush green, 3D Pixar style' },
      { pageNumber: 4, text: '바람결에 달콤한 과일 냄새가 났어요. 요정들과 함께 탐스러운 사과와 포도를 똑똑 따서 맛있게 나눠 먹었답니다.', imagePrompt: 'Fairies and a child picking apples and grapes in a magical orchard, 3D Pixar style' },
      { pageNumber: 5, text: '가을 요정이 붓을 칠하자 나뭇잎이 노랗고 붉게 물들며 바스락 소리를 냈어요. 숲속은 온통 예쁜 황금빛으로 변했어요.', imagePrompt: 'An autumn fairy painting leaves golden and red with a magical brush, 3D Pixar style' },
      { pageNumber: 6, text: '겨울 요정은 하얀 눈송이 이불을 덮어 정원을 재워주었어요. 뽀드득뽀드득 눈밭 위를 구르며 신나게 눈싸움을 했어요.', imagePrompt: 'A winter fairy covering the garden in snow, a child playing snowball fight, 3D Pixar style' },
      { pageNumber: 7, text: '계절마다 아름답게 옷을 갈아입는 자연의 모습은 정말 마법 같았어요. 내일은 정원에 또 어떤 신기한 일이 벌어질까요?', imagePrompt: 'A magical garden showing all four seasons at once, fairy dust, wonder, 3D Pixar style' },
    ],
    imageUrls: Array.from({ length: 7 }, () => '/images/garden-cover.jpg'),
    coverImageUrl: '/images/garden-cover.jpg',
  },
];

export function getDummyBook(id: string): DummyBook | undefined {
  return dummyBooks.find((b) => b.id === id);
}
