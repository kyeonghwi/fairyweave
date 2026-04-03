# Phase 6: Realistic Picture Book Viewer

## Feature Summary
Replace `PageSlider` with `BookViewer` — renders the book preview like a real open picture book.
Real page-flip animation + spread layout so it feels like holding an actual children's book.

---

## Research: How Real Picture Books Work

실제 동화책의 레이아웃 패턴 (세계적으로 많이 쓰이는 3가지):

| 패턴 | 설명 | 예시 |
|------|------|------|
| **Classic Split** | 왼쪽 = 글, 오른쪽 = 일러스트 (또는 반대) | Where the Wild Things Are, 그림형제 동화 |
| **Full Bleed + Text Band** | 그림이 전체 페이지 가득, 하단에 텍스트 밴드 | The Very Hungry Caterpillar, 우리 앱 현재 방향과 유사 |
| **Panoramic Spread** | 두 페이지 걸쳐 하나의 넓은 그림, 텍스트 오버레이 | Goodnight Moon, 대형 그림책 |

FairyWeave에서 채택할 레이아웃:
- **데스크탑**: Open book spread — 왼쪽 페이지 = 텍스트, 오른쪽 페이지 = 일러스트
- **모바일**: Single page — 이미지 + 텍스트 (기존 방식, UX 개선만)
- **페이지 넘김**: CSS 3D flip (오른쪽 페이지가 왼쪽으로 넘어가는 애니메이션)

---

## Architecture

### 기존 → 변경

| 파일 | 변경 내용 |
|------|----------|
| `frontend/src/components/PageSlider.tsx` | 삭제 (BookViewer로 교체) |
| `frontend/src/components/BookViewer.tsx` | **신규** — 메인 컴포넌트 |
| `frontend/src/components/BookSpread.tsx` | **신규** — 데스크탑 spread 뷰 |
| `frontend/src/components/BookPage.tsx` | **신규** — 단일 페이지 렌더링 |
| `frontend/src/app/globals.css` | pageFlip 애니메이션 추가 |
| `frontend/src/app/book/[id]/page.tsx` | PageSlider → BookViewer import 변경 |

---

## Component Design

### BookViewer (최상위)

```tsx
// Props — PageSlider와 동일하게 유지 (하위 호환)
interface BookViewerProps {
  pages: { text: string }[];
  imageUrls: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle?: string;
}
```

- 화면 너비 감지 → 데스크탑(≥768px): `BookSpread`, 모바일: `MobileView`
- 키보드(←→) + 스와이프 이벤트 처리

### BookSpread (데스크탑 spread)

```
┌─────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐        │
│  │              │              │        │
│  │  왼쪽 페이지  │ 오른쪽 페이지 │        │
│  │  (텍스트)    │  (일러스트)   │        │
│  │              │              │        │
│  └──────────────┴──────────────┘        │
│     ↑ 책 spine 그림자          ↑ 페이지 컬  │
│                                         │
│       ←  [1/8]  →                      │
└─────────────────────────────────────────┘
```

시각 요소:
- 책 전체에 `perspective: 1500px` 컨테이너
- 가운데 spine: 세로 선 + 안쪽 그림자
- 왼쪽 페이지: 오른쪽 가장자리 어두운 그림자 (spine 방향)
- 오른쪽 페이지: 왼쪽 가장자리 어두운 그림자 + 미세한 페이지 컬 효과
- 배경: 크림색 오프화이트 (`#faf6f0`)

페이지 번호 매핑:
- `currentPage` 0 → 오른쪽에 표지(cover, page 0 이미지), 왼쪽은 blank
- `currentPage` 홀수 → 왼쪽: pages[n-1] 텍스트, 오른쪽: pages[n] 이미지
- `currentPage` 짝수(>0) → 왼쪽: pages[n-1] 이미지, 오른쪽: pages[n] 텍스트

간단히: 짝수 페이지 = spread 기준 우측, 홀수 = 좌측

**Spread 번호 단순화 전략**: 
- spreadIndex = Math.floor(currentPage / 2)
- 왼쪽 = pages[spreadIndex * 2]  (이미지)
- 오른쪽 = pages[spreadIndex * 2 + 1]  (텍스트)
- 첫 spread: 왼쪽 blank (표지 펼침), 오른쪽 = pages[0]

### 페이지 넘김 애니메이션

CSS 3D transform 방식 (라이브러리 없음):

```css
@keyframes flipForward {
  0%   { transform: perspective(1500px) rotateY(0deg); z-index: 10; }
  50%  { transform: perspective(1500px) rotateY(-90deg); z-index: 10; box-shadow: -8px 0 20px rgba(0,0,0,0.3); }
  100% { transform: perspective(1500px) rotateY(-180deg); z-index: 1; }
}

@keyframes flipBackward {
  0%   { transform: perspective(1500px) rotateY(-180deg); z-index: 10; }
  50%  { transform: perspective(1500px) rotateY(-90deg); z-index: 10; box-shadow: -8px 0 20px rgba(0,0,0,0.3); }
  100% { transform: perspective(1500px) rotateY(0deg); z-index: 1; }
}
```

- 넘기는 동안 새 페이지는 뒤에서 대기 (`backface-visibility: hidden`)
- 애니메이션 duration: 600ms (너무 빠르면 어색함)
- 넘기는 중 다음 클릭 방지 (`isFlipping` state)
- `prefers-reduced-motion`: 즉시 전환 (flip 없이)

### MobileView (모바일)

기존 PageSlider 동작 유지하되 UI만 개선:
- 이미지 위, 텍스트 아래 (기존과 동일)
- 스와이프 감지 유지
- 텍스트를 이미지 하단 반투명 오버레이로 변경 (책처럼 보이게)
- 페이지 넘김: 기존 slidePage 애니메이션 유지 (3D flip은 모바일에서 성능 이슈 가능)

---

## Implementation Steps

### Step 1: CSS 애니메이션 추가 (globals.css)
- `@keyframes flipForward`, `flipBackward` 추가
- `.animate-flipForward`, `.animate-flipBackward` 클래스 추가
- `prefers-reduced-motion` 처리

### Step 2: BookPage 컴포넌트
- 단일 페이지 렌더링 (이미지 OR 텍스트)
- props: `type: 'image' | 'text'`, `imageUrl?`, `text?`, `pageNum`
- 텍스트 페이지: 크림색 배경, 손글씨 느낌 폰트(Jua), 세로 가운데 정렬
- 이미지 페이지: `object-cover` 비율 고정

### Step 3: BookSpread 컴포넌트
- 두 BookPage를 좌우로 배치
- 책 전체 shadow + spine 렌더링
- `isFlipping` state + 애니메이션 트리거

### Step 4: BookViewer 컴포넌트
- 반응형: md 이상 BookSpread, 미만 MobileView
- 기존 PageSlider와 완전히 동일한 props interface
- 키보드, 터치 이벤트

### Step 5: book/[id]/page.tsx 교체
- import `PageSlider` → `BookViewer`
- props 그대로 전달 (interface 동일하므로 변경 없음)

### Step 6: 텍스트 위치 정리
- 현재 book/[id]/page.tsx의 `{book.pages[currentPage].text}` 별도 표시 부분
- BookViewer 내부에서 텍스트를 처리하므로 외부 텍스트 표시 제거

---

## Visual Design

### 책 spread 비율
- 전체 컨테이너: `aspect-[2/1.3]` (가로로 넓게, 실제 책 비율)
- 각 페이지: `aspect-[1/1.3]` (세로로 약간 긴 직사각형)

### 페이지 스타일
```
왼쪽 페이지 (텍스트):
- 배경: #faf6f0 (따뜻한 크림)
- 폰트: Jua, 18-22px
- 패딩: 10% 상하좌우
- 오른쪽 그림자: inset -8px 0 15px rgba(0,0,0,0.1)

오른쪽 페이지 (이미지):
- 이미지: object-cover 전체 채움
- 왼쪽 그림자: inset 8px 0 15px rgba(0,0,0,0.1)
- 오른쪽 가장자리: 미세한 컬 (box-shadow)

Spine (가운데 선):
- 너비: 12px
- 배경: linear-gradient(to right, #d4c9b8, #e8e0d5, #d4c9b8)
- 수직 그림자로 깊이 표현
```

### 책 외곽 shadow
```css
box-shadow: 
  0 10px 40px rgba(0,0,0,0.25),
  0 4px 12px rgba(0,0,0,0.15);
```

---

## Out of Scope (이번에 하지 않는 것)

- 3D 책 커버 회전 (표지 페이지를 입체적으로 보여주기)
- 페이지 텍스처 이미지 사용 (CSS로만 구현)
- 음향 효과 (페이지 넘기는 소리)
- 줌 기능
- 전체화면 모드

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**VERDICT:** NO REVIEWS YET
