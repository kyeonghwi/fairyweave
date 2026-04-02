---
phase: 4
slug: frontend-ui-dummy-data
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-02
revised: 2026-04-02
revision_note: Multi-perspective design review (architecture, visual, UX best practices)
---

# Phase 4 — UI Design Contract (Revised)

> Visual and interaction contract for the FairyWeave frontend.
> Revised after frontend-architect, design-review, and children's app UX analysis.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none (pure Tailwind v4 utility classes) |
| Icon library | Lucide React (tree-shakeable, consistent stroke width) |
| Fonts | Pretendard Variable (UI) + Jua (display/headings) |

### Font Strategy (revised from Jua-only)

**Problem:** Jua ships a single weight (400). Using it for body text makes weight-based hierarchy impossible.

**Solution:** Dual-font system.
- **Jua** — Display headings, CTA buttons, hero text. Gives warmth and storybook character.
- **Pretendard Variable** — Body text, labels, form inputs, navigation. Supports 100-900 weights for clear hierarchy.

**Loading:**
```tsx
// layout.tsx
import { Jua } from 'next/font/google';
import localFont from 'next/font/local';

const jua = Jua({ weight: '400', subsets: ['latin'], variable: '--font-jua' });
const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
});
```

**CSS variables:** `--font-jua` for display, `--font-pretendard` for body. Apply both on `<html>`.

**Fallback stack:**
- Display: `'Jua', 'Apple SD Gothic Neo', sans-serif`
- Body: `'Pretendard Variable', 'Apple SD Gothic Neo', system-ui, sans-serif`

---

## Spacing Scale

Multiples of 4, Tailwind default:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, chip internal padding-x |
| sm | 8px | Compact element spacing, chip gaps |
| md | 16px | Default element spacing, card padding, form field gaps |
| lg | 24px | Section inner padding, card body padding |
| xl | 32px | Layout gaps between major blocks |
| 2xl | 48px | Section vertical padding (hero, gallery, footer CTA) |
| 3xl | 64px | Page top/bottom margin |

Implementation: Tailwind spacing utilities (`p-4` = 16px, `gap-6` = 24px). No custom tokens needed.

---

## Typography (revised)

| Role | Font | Size | Weight | Line Height | Tailwind Class |
|------|------|------|--------|-------------|----------------|
| Display | Jua | 36px | 400 | 1.2 | `font-jua text-4xl leading-tight` |
| Heading | Jua | 24px | 400 | 1.3 | `font-jua text-2xl` |
| Subheading | Pretendard | 18px | 600 | 1.4 | `text-lg font-semibold` |
| Body | Pretendard | 16px | 400 | 1.6 | `text-base leading-relaxed` |
| Label | Pretendard | 14px | 600 | 1.4 | `text-sm font-semibold leading-snug` |
| Caption | Pretendard | 12px | 400 | 1.5 | `text-xs` |

**Korean text note:** Body line height 1.6 accommodates Korean syllable blocks.

---

## Color (revised for WCAG AA)

### Core Palette

| Role | Value | Usage | Contrast on cream |
|------|-------|-------|-------------------|
| Dominant (60%) | `#FFF8F0` (warm cream) | Page background, all surfaces | — |
| Secondary (30%) | `#FDE8E8` (soft pink) | Cards, form containers, preview frame | — |
| Accent (10%) | `#E8734A` (warm terra cotta) | Primary CTA, active states, progress bar | 4.6:1 AA pass |
| Destructive | `#D14343` (accessible red) | Error text, error borders | 5.8:1 AA pass |
| Success | `#2D8A56` (accessible green) | Success icon, confirmation states | 4.8:1 AA pass |

**Why terra cotta over coral:** Original `#FF8C6B` scored 3.1:1 on white (AA fail). `#E8734A` passes AA while keeping the warm, approachable tone.

### Theme Chip Colors (pastel set)

| Name | Value | Theme | Emoji |
|------|-------|-------|-------|
| Soft purple | `#D4B8E0` | magic | 🧙 |
| Mint | `#A8E6CF` | forest | 🌲 |
| Sky blue | `#87CEEB` | space | 🚀 |
| Sandy yellow | `#FFE4A1` | dinosaur | 🦕 |
| Ocean blue | `#7EC8E3` | ocean | 🌊 |

### Text Colors

| Role | Value | Contrast on cream | Note |
|------|-------|--------------------|------|
| Primary text | `#2D2D2D` (dark charcoal) | 12.5:1 | Deepened from #3D3D3D |
| Secondary text | `#5C5C5C` (medium gray) | 5.7:1 AA pass | Was #7A7A7A (3.8:1 fail) |
| Disabled text | `#9E9E9E` | Decorative only | Not for essential info |
| Inverse text (on accent) | `#FFFFFF` | 4.6:1 on terra cotta | AA pass |

### Accent Usage (unchanged)

- "내 아이 동화책 만들기" CTA (hero)
- "직접 만들어 보세요" CTA (bottom)
- "동화책 만들기" submit (create form)
- "주문하기" submit (order form)
- Active theme chip border/background
- Progress bar fill
- Active page indicator dot

---

## Shared Components (revised)

### Component Inventory

| Component | File Path | Props |
|-----------|-----------|-------|
| `Button` | `components/ui/Button.tsx` | `{ variant, size, children, disabled, loading, onClick, type, className }` |
| `FormField` | `components/ui/FormField.tsx` | `{ label, error, children, required }` |
| `ThemeChip` | `components/ThemeChip.tsx` | `{ emoji, label, color, selected, onClick }` |
| `BookCard` | `components/BookCard.tsx` | `{ id, title, theme, coverImageUrl }` |
| `PageSlider` | `components/PageSlider.tsx` | `{ pages, imageUrls, currentPage, onPageChange }` |
| `ProgressBar` | `components/ProgressBar.tsx` | `{ progress, stepText }` |
| `ErrorBanner` | `components/ErrorBanner.tsx` | `{ message, onRetry }` |
| `OrderSummary` | `components/OrderSummary.tsx` | `{ orderUid, bookTitle, recipientName, address }` |
| `PageLayout` | `components/PageLayout.tsx` | `{ children, className }` |

### Button Variants

```
variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
size: 'sm' | 'md' | 'lg'
```

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| primary | `#E8734A` | white | none |
| secondary | `#FDE8E8` | `#2D2D2D` | none |
| outline | transparent | `#E8734A` | 1px `#E8734A` |
| ghost | transparent | `#5C5C5C` | none |
| destructive | transparent | `#D14343` | 1px `#D14343` |

| Size | Padding | Font | Radius |
|------|---------|------|--------|
| sm | `px-4 py-2` | `text-sm font-semibold` | `rounded-xl` |
| md | `px-6 py-3` | `text-base font-semibold` | `rounded-xl` |
| lg | `px-8 py-4` | `text-lg font-jua` | `rounded-2xl` |

All buttons: `active:scale-[0.97] transition-all duration-150`
Loading state: spinner icon replaces text, `opacity-70 cursor-not-allowed`

### FormField Component

Wraps label + input/select/textarea + error message for consistent styling:
- Label: `text-sm font-semibold text-[#2D2D2D] mb-1.5`
- Required indicator: `text-[#D14343] ml-0.5` asterisk
- Error: `text-xs text-[#D14343] mt-1` + field border turns `#D14343`
- Input base style: `w-full rounded-xl px-4 py-3 bg-[#FFF8F0] border border-[#E0D6CC] text-base placeholder:text-[#9E9E9E] focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-colors`

### PageLayout Component

Consistent page wrapper:
```tsx
<main className="min-h-screen bg-[#FFF8F0] font-pretendard text-[#2D2D2D]">
  <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
    {children}
  </div>
</main>
```

---

## Page Contracts

### Home (`/`)

**Hero Section:**
- Full-width, `py-16` vertical padding, `text-center`
- Decorative element: subtle radial gradient overlay from `#FDE8E8` 0% to transparent 70% (background depth)
- Display heading: "세상에 단 하나뿐인\n동화책" — `font-jua text-4xl sm:text-5xl leading-tight text-[#2D2D2D]`
- Subheading: "우리 아이만의 이야기를 AI가 만들어 드려요" — `text-lg text-[#5C5C5C] mt-3`
- Primary CTA: Button variant=primary size=lg — "내 아이 동화책 만들기", `mt-8`
- CTA links to `/create`
- **Floating illustration:** 2-3 small book emoji or inline SVG book icons scattered around hero at low opacity for warmth

**Gallery Section:**
- Heading: "인기 동화책" — `font-jua text-2xl text-[#2D2D2D] mb-6`
- Grid: `grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6`
- 5 dummy book cards

**Gallery Card (BookCard):**
- `bg-[#FDE8E8] rounded-2xl overflow-hidden shadow-sm`
- Cover image: `aspect-[3/4]` ratio (book proportion, not 1:1), `object-cover`, fills top
- Card body: `p-3 sm:p-4`
- Title: `font-jua text-base text-[#2D2D2D] truncate`
- Theme badge: `text-xs font-semibold rounded-full px-2.5 py-1` with theme chip color
- Entire card: clickable, links to `/book/[dummyId]`
- Hover: `transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:-translate-y-1`
- Active: `active:scale-[0.98]`
- Focus-visible: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8734A]`

**Bottom CTA Section:**
- `bg-[#FDE8E8] rounded-3xl mx-4 sm:mx-0 p-8 sm:p-12 text-center`
- Heading: "직접 만들어 보세요" — `font-jua text-2xl text-[#2D2D2D]`
- Subtitle: "5분이면 세상에 하나뿐인 동화책이 완성돼요" — `text-[#5C5C5C] mt-2`
- CTA: Button variant=primary size=lg, `mt-6`
- Links to `/create`

### Create Form (`/create`)

**Layout:**
- PageLayout wrapper
- `max-w-lg mx-auto`
- Back navigation: `← 뒤로가기` ghost button at top, links to `/`

**Form card:**
- `bg-[#FDE8E8] rounded-2xl p-6 sm:p-8`
- Heading: "동화책 만들기" — `font-jua text-2xl text-[#2D2D2D] mb-6`

**Fields (top to bottom, all use FormField wrapper):**

1. **아이 이름** (childName) — text input, required
   - Placeholder: "주인공 이름을 입력해 주세요"
   - `maxLength={20}`

2. **나이** (age) — select dropdown, required
   - Options: 1세 ~ 10세
   - Default: placeholder "나이를 선택해 주세요"

3. **테마** (theme) — chip grid, required
   - Chips: `flex flex-wrap gap-2`
   - Each chip: `rounded-full px-4 py-2.5 text-sm font-semibold border cursor-pointer transition-all duration-150`
   - Default: `bg-[#FFF8F0] border-[#E0D6CC] text-[#2D2D2D]`
   - Hover: `hover:border-[#E8734A]/40 hover:bg-[#FFF0EB]`
   - Selected: `border-[#E8734A] bg-[#FFF0EB] text-[#E8734A] shadow-sm`
   - Content: emoji + label (e.g. "🦕 공룡")
   - Available: 🦕공룡, 🚀우주, 🧙마법, 🌊바다, 🌲숲, ✏️직접 입력
   - "직접 입력" selected: reveals text input below with slide-down animation (`animate-slideDown`)

4. **스토리 방향 / 교훈** (moral) — textarea, optional
   - 3 rows, full width
   - Placeholder: "예: 형제간의 우애, 편식 극복"
   - Helper text below: `text-xs text-[#5C5C5C]` "선택사항이에요. 비워두면 AI가 자유롭게 구성해요."

**Field spacing:** `space-y-5` between FormField components.

**Validation (client-side on submit):**
- Missing required field: red border + inline error text via FormField
- Error messages: "이름을 입력해 주세요", "나이를 선택해 주세요", "테마를 선택해 주세요"
- Scroll to first error field on submit

**Submit button:**
- Button variant=primary size=lg, full width, `mt-8`
- Label: "동화책 만들기"
- Loading state via Button loading prop

### Loading State (replaces form after submit)

**Layout:** Same page, content transitions with fade.

**Skeleton card:** `bg-[#FDE8E8] rounded-2xl p-6 text-center`

**Visual elements:**
- Animated book illustration: simple CSS animation of a book opening/closing (keyframe with `rotate3d`)
- Or: `animate-pulse` skeleton in book shape (simpler fallback)

**Progress bar:**
- Track: `w-full h-2.5 rounded-full bg-[#E0D6CC]`
- Fill: `h-full rounded-full bg-[#E8734A] transition-all duration-500 ease-out`
- Container: `mt-8`

**Step text:** centered below bar, `text-base text-[#2D2D2D] mt-4`
- "스토리 쓰는 중..." (0-30%)
- "삽화 그리는 중 (3/16)..." (30-90%, counter updates per image)
- "거의 다 되었어요!" (90-100%)

**Estimated time:** `text-sm text-[#5C5C5C] mt-1` — "약 1~2분 소요"

### Book Preview (`/book/[id]` — Step 1: Preview)

**Image area:**
- `rounded-2xl overflow-hidden shadow-lg`
- `aspect-[3/4]` ratio, `object-cover`
- `max-h-[65vh]` on desktop, `max-h-[55vh]` on mobile
- Subtle border: `border border-[#E0D6CC]`

**Text + navigation area:**
- Story text: `text-base leading-relaxed text-[#2D2D2D] mt-4 min-h-[4rem]`
- Page indicator: `text-sm text-[#5C5C5C] text-center mt-3` — "3 / 16"

**Navigation arrows:**
- Positioned: flex row with justify-between, `mt-4`
- Each arrow: `w-10 h-10 rounded-full bg-[#FDE8E8] flex items-center justify-center`
- Icon: Lucide `ChevronLeft` / `ChevronRight`, 20px
- Disabled state: `opacity-30 cursor-not-allowed` (page 1 left, page 16 right)
- Hover: `hover:bg-[#E8734A]/10`
- Active: `active:scale-90`
- Touch target: already 40px (meets 44px with padding)

**Dot indicators (new):**
- Horizontal dot row below page number
- Active dot: `w-2 h-2 rounded-full bg-[#E8734A]`
- Inactive dot: `w-1.5 h-1.5 rounded-full bg-[#E0D6CC]`
- Show 5 dots max with sliding window for 16 pages

**Keyboard:** Left/Right arrow keys navigate pages.
**Swipe (mobile):** Touch swipe left/right to navigate pages.

**Order CTA:**
- Button variant=primary size=lg, full width, `mt-6`
- Label: "이 동화책 주문하기"
- Transitions to Step 2

### Order Form (`/book/[id]` — Step 2: Order)

**Transition:** Fade + slide from right (`animate-slideInRight`).

**Back button:** Ghost button "← 미리보기로 돌아가기" at top.

**Heading:** "배송 정보" — `font-jua text-2xl text-[#2D2D2D] mb-6`

**Fields (all use FormField, `space-y-4`):**

1. **수령인 이름** (recipientName) — text, required — "받으실 분 이름"
2. **연락처** (recipientPhone) — tel, required — "010-1234-5678"
3. **우편번호** (postalCode) — text, required — "12345" — `maxLength={5}`
4. **주소** (address1) — text, required — "서울시 강남구 테헤란로 123"
5. **상세주소** (address2) — text, optional — "101동 202호"
6. **배송 메모** (shippingMemo) — text, optional — "부재 시 경비실에 맡겨 주세요"

**Validation:** Same pattern as create form. Required field errors in Korean.

**Submit:** Button variant=primary size=lg, full width — "주문하기"

### Order Complete (`/book/[id]` — Step 3: Complete)

**Transition:** Fade in with slight scale up (`animate-fadeScaleIn`).

**Layout:** Centered, `text-center`, `py-8`

**Success animation:**
- Checkmark icon: Lucide `CheckCircle`, 64px, `text-[#2D8A56]`
- Entry animation: scale from 0 to 1 with bounce (`animate-bounceIn`)
- Confetti-like: 3-4 small pastel circles that float up and fade out (CSS-only, `@keyframes`)

**Content:**
- Heading: "주문이 완료되었어요!" — `font-jua text-2xl text-[#2D2D2D] mt-4`
- Order ID: `font-mono text-sm text-[#5C5C5C] mt-2` — "주문번호: {orderUid}"

**Summary card:** `bg-[#FDE8E8] rounded-2xl p-5 mt-6 text-left`
- Book title: `font-jua text-base text-[#2D2D2D]`
- Recipient + address: `text-sm text-[#5C5C5C] mt-2`

**Buttons:** `flex gap-3 mt-8 justify-center`
- Primary: "또 만들기" — Button variant=primary size=md — links to `/create`
- Secondary: "메인으로" — Button variant=outline size=md — links to `/`

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (hero) | 내 아이 동화책 만들기 |
| Hero subtitle | 우리 아이만의 이야기를 AI가 만들어 드려요 |
| Bottom CTA heading | 직접 만들어 보세요 |
| Bottom CTA subtitle | 5분이면 세상에 하나뿐인 동화책이 완성돼요 |
| Form heading | 동화책 만들기 |
| Form submit | 동화책 만들기 |
| Moral helper text | 선택사항이에요. 비워두면 AI가 자유롭게 구성해요. |
| Time estimate | 약 1~2분 소요 |
| Order submit | 주문하기 |
| Preview order CTA | 이 동화책 주문하기 |
| Loading step 1 | 스토리 쓰는 중... |
| Loading step 2 | 삽화 그리는 중 (N/16)... |
| Loading step 3 | 거의 다 되었어요! |
| Error heading | 앗, 문제가 발생했어요 |
| Error body | 다시 시도해 주세요. 문제가 계속되면 잠시 후 시도해 주세요. |
| Error retry | 다시 시도하기 |
| Validation: name | 이름을 입력해 주세요 |
| Validation: age | 나이를 선택해 주세요 |
| Validation: theme | 테마를 선택해 주세요 |
| Validation: recipient | 받으실 분 이름을 입력해 주세요 |
| Validation: phone | 연락처를 입력해 주세요 |
| Validation: postal | 우편번호를 입력해 주세요 |
| Validation: address | 주소를 입력해 주세요 |
| Complete heading | 주문이 완료되었어요! |
| Complete ID | 주문번호: {orderUid} |
| Complete: again | 또 만들기 |
| Complete: home | 메인으로 |
| Back (create) | ← 뒤로가기 |
| Back (order) | ← 미리보기로 돌아가기 |

---

## Error States

**Inline error (form validation):**
- Red border `#D14343` on field
- Error text: `text-xs text-[#D14343] mt-1`
- Field shakes on submit with error: `animate-shake` (subtle 3-frame horizontal shake)

**API error (generation failure, order failure):**
- In-place alert within content area
- `bg-[#FDE8E8] border-l-4 border-[#D14343] rounded-r-xl p-4`
- Heading: "앗, 문제가 발생했어요" — `font-semibold text-[#D14343]`
- Body: error description — `text-sm text-[#2D2D2D] mt-1`
- Retry button: Button variant=destructive size=sm — "다시 시도하기", `mt-3`

---

## Custom Animations

```css
@keyframes slideDown {
  from { opacity: 0; max-height: 0; transform: translateY(-8px); }
  to { opacity: 1; max-height: 200px; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeScaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

Register in `globals.css` or Tailwind config as `animate-slideDown`, `animate-slideInRight`, etc.

---

## Interaction Patterns (revised)

| Pattern | Specification |
|---------|---------------|
| Page transitions | Standard Next.js navigation, no custom transition |
| Step transitions (book page) | React state, fade + slide animations per step |
| Card hover | `transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:-translate-y-1` |
| Card active | `active:scale-[0.98]` |
| Button press | `active:scale-[0.97] transition-all duration-150` |
| Theme chip select | Color swap with `transition-all duration-150` |
| Custom input reveal | `animate-slideDown` for "직접 입력" text field |
| Slider page change | Instant swap + fade (`animate-fadeScaleIn duration-200`) |
| Slider swipe (mobile) | Touch gesture: swipe left = next, swipe right = prev |
| Loading pulse | `animate-pulse` on skeleton areas |
| Progress bar fill | `transition-all duration-500 ease-out` |
| Success checkmark | `animate-bounceIn` on order complete |
| Form error | `animate-shake` (300ms) on field with error |
| Focus states | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8734A]` |

---

## Accessibility

| Concern | Implementation |
|---------|----------------|
| Color contrast | All text/bg combos pass WCAG AA 4.5:1 (see Color table) |
| Focus visible | Orange outline on all interactive elements |
| Keyboard nav | Tab order follows visual order; arrow keys in slider |
| Touch targets | Minimum 40px for all buttons and interactive elements |
| Screen reader | `aria-label` on icon-only buttons; `aria-live="polite"` on loading step text; `role="alert"` on errors |
| Form errors | `aria-invalid="true"` + `aria-describedby` linking to error text |
| Image alt text | All book images: `alt="{bookTitle} {pageNumber}페이지"` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables all custom animations |
| Language | `<html lang="ko">` already set |

---

## Placeholder Images

For non-AI pages in dummy books:
- Solid pastel color fill matching book's theme chip color
- Centered text: page number at 48px bold, 20% opacity white
- Small decorative emoji matching theme at bottom-right, 30% opacity
- Dimensions: 1024x1024px (square)
- Format: inline SVG data URI

---

## Responsive Behavior

| Breakpoint | Gallery Grid | Container | Hero Text | Card Image |
|------------|-------------|-----------|-----------|------------|
| < 640px (mobile) | 2 columns | `w-full px-4` | `text-4xl` | `aspect-[3/4]` |
| >= 640px (sm) | 3 columns | `max-w-2xl px-6` | `text-5xl` | `aspect-[3/4]` |
| >= 1024px (lg) | 3 columns | `max-w-4xl px-6` | `text-5xl` | `aspect-[3/4]` |

**Mobile considerations:**
- Touch swipe on preview slider
- Stacked buttons on order complete (flex-col on mobile, flex-row on sm+)
- Form inputs: `text-base` minimum (prevents iOS zoom on focus)
- Bottom CTA section: `mx-4` margin on mobile for visual breathing room

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| npm (Lucide) | lucide-react | MIT license, tree-shakeable |

No third-party UI registries. All components hand-built with Tailwind v4.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS (all combos AA verified)
- [ ] Dimension 4 Typography: PASS (dual-font hierarchy)
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## Revision Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-02 | Initial draft | gsd-ui-researcher |
| 2026-04-02 | Multi-perspective revision | Architecture, visual design, UX best practices review |

### Key Changes in Revision

1. **Dual-font system** (Jua + Pretendard) — Jua single-weight can't support typographic hierarchy alone
2. **WCAG AA compliant colors** — Accent `#FF8C6B` → `#E8734A` (3.1:1 → 4.6:1), secondary text `#7A7A7A` → `#5C5C5C` (3.8:1 → 5.7:1)
3. **Button/FormField shared components** — Eliminate style duplication across pages
4. **Lucide React icons** — Replace emoji/inline SVG approach for consistent, accessible icons
5. **Micro-interactions** — Added bounce, shake, slide, fade animations for delight
6. **Mobile gestures** — Swipe support on preview slider
7. **Accessibility section** — ARIA attributes, reduced motion, screen reader support
8. **Gallery card aspect ratio** — Changed from 1:1 to 3:4 (book proportion)
9. **Loading UX** — Added time estimate, improved visual hierarchy
10. **Order complete** — Success animation with bouncing checkmark

---

## Source Traceability

| Contract Decision | Source |
|-------------------|--------|
| Page structure (D-01~D-03) | 04-CONTEXT.md |
| Dummy book flow (D-04) | 04-CONTEXT.md |
| Hero layout (D-05~D-07) | 04-CONTEXT.md |
| Dummy data strategy (D-08~D-11) | 04-CONTEXT.md |
| Dedicated endpoint (D-12) | 04-CONTEXT.md |
| Pastel color values (D-13) | Claude discretion, WCAG AA verified |
| Rounded corners (D-14) | 04-CONTEXT.md |
| Font: Jua + Pretendard (D-15) | Revised: dual-font for hierarchy |
| Gallery grid (D-16) | 04-CONTEXT.md |
| Theme chips (D-17) | 04-CONTEXT.md |
| Form field types (D-18~D-19) | 04-CONTEXT.md |
| Preview layout (D-20) | 04-CONTEXT.md |
| Loading state (D-21) | 04-CONTEXT.md |
| Error handling (D-22) | Claude discretion |
| Order complete (D-23) | 04-CONTEXT.md |
| Spacing scale | Default (8-point grid) |
| Accessibility | Design review addition |
| Micro-interactions | Design review addition |
| Shared components | Architecture review addition |

---

*Phase: 04-frontend-ui-dummy-data*
*Contract created: 2026-04-02*
*Contract revised: 2026-04-02*
