<!-- /autoplan restore point: /c/Users/khp.PKH/.gstack/projects/kyeonghwi-fairyweave/main-autoplan-restore-20260403-214019.md -->
# FairyWeave Design Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate FairyWeave frontend from coral/orange theme to Material Design 3 pink/rose watercolor design system, adding TopNavBar, SideNavBar, and overhauled page layouts per the provided HTML mockups.

**Architecture:** Extract M3 color tokens into Tailwind config. Build shared navigation shell (TopNav + SideNav + MobileNav) as layout components. Refactor each page (Home, Book/Order) to use the new shell and design tokens. Preserve all existing business logic and API integration.

**Tech Stack:** Next.js 16, Tailwind CSS 4, React 19, TypeScript, lucide-react, Google Material Symbols

---

## Design Delta Summary

| Aspect | Current | Target |
|--------|---------|--------|
| Primary color | `#E8734A` (coral) | `#974362` (rose) |
| Background | `#FFF8F0` (cream) | `#fff8f1` (warm white) |
| Secondary | `#FDE8E8` (pink) | `#69558e` (purple) |
| Tertiary | none | `#7d5817` (amber) |
| Layout | Centered max-w-4xl | TopNav + SideNav shell |
| Navigation | Back buttons only | Fixed TopNav, SideNav (desktop), BottomNav (mobile) |
| Typography | Jua headings inline | `.font-jua` utility class |
| Border radius | `rounded-xl/2xl` | `rounded-DEFAULT(1rem)/lg(2rem)` |
| Icons | lucide-react | Material Symbols Outlined |
| Card style | `bg-[#FDE8E8]` flat | Glass/shadow with M3 surface tokens |

---

### Task 1: Add Material Symbols font and M3 color tokens to Tailwind

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`

**Step 1: Update tailwind.config.ts with M3 color tokens**

Replace the empty `extend` block with the full M3 color palette and font families from the mockup:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#fff8f1",
        "surface-dim": "#e1d9cc",
        "surface-bright": "#fff8f1",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#faf2e9",
        "surface-container": "#f5ede2",
        "surface-container-high": "#efe7db",
        "surface-container-highest": "#eae1d4",
        "surface-variant": "#eae1d4",
        "surface-tint": "#974362",
        "on-surface": "#363229",
        "on-surface-variant": "#645e54",
        "on-background": "#363229",
        "background": "#fff8f1",
        "primary": "#974362",
        "primary-dim": "#883756",
        "primary-container": "#fe97b9",
        "primary-fixed": "#fe97b9",
        "primary-fixed-dim": "#ee8aac",
        "on-primary": "#fff7f7",
        "on-primary-container": "#621837",
        "on-primary-fixed": "#420020",
        "on-primary-fixed-variant": "#6d2140",
        "secondary": "#69558e",
        "secondary-dim": "#5c4981",
        "secondary-container": "#ebdcff",
        "secondary-fixed": "#ebdcff",
        "secondary-fixed-dim": "#dfccff",
        "on-secondary": "#fef7ff",
        "on-secondary-container": "#5b487f",
        "on-secondary-fixed": "#48356b",
        "on-secondary-fixed-variant": "#65518a",
        "tertiary": "#7d5817",
        "tertiary-dim": "#704c0a",
        "tertiary-container": "#ffcc80",
        "tertiary-fixed": "#ffcc80",
        "tertiary-fixed-dim": "#f0be74",
        "on-tertiary": "#fff8f2",
        "on-tertiary-container": "#644200",
        "on-tertiary-fixed": "#4b3100",
        "on-tertiary-fixed-variant": "#6f4c09",
        "outline": "#807a6f",
        "outline-variant": "#b9b1a5",
        "error": "#a8364b",
        "error-dim": "#6b0221",
        "error-container": "#f97386",
        "on-error": "#fff7f7",
        "on-error-container": "#6e0523",
        "inverse-surface": "#100e0a",
        "inverse-on-surface": "#a19c95",
        "inverse-primary": "#fe97b9",
      },
      fontFamily: {
        "headline": ["var(--font-jua)", "sans-serif"],
        "body": ["var(--font-pretendard)", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Add Material Symbols and utility classes to globals.css**

Add to `globals.css` after existing animations:

```css
/* Material Symbols */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* Design system utilities */
.font-jua { font-family: var(--font-jua), sans-serif; }
.watercolor-gradient { background: linear-gradient(45deg, #974362, #fe97b9); }
.glass-effect { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.word-break-keep { word-break: keep-all; }
.tonal-shadow { box-shadow: 0 12px 32px -8px rgba(54, 50, 41, 0.08); }
```

**Step 3: Add Material Symbols font link to layout.tsx**

Update `layout.tsx`:
- Change body classes from `text-[#2D2D2D] bg-[#FFF8F0]` to `text-on-surface bg-surface`
- Add Material Symbols Outlined font via `<link>` in `<head>` (use Next.js metadata or direct link)
- Update skip-link color from `#E8734A` to `primary`

**Step 4: Verify Tailwind config loads**

Run: `cd D:/Fairyweave && npm run dev`
Expected: Dev server starts, no Tailwind errors. Verify `bg-primary` resolves to `#974362` in browser.

**Step 5: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/app/globals.css frontend/src/app/layout.tsx
git commit -m "feat: add M3 color tokens and Material Symbols to design system"
```

---

### Task 2: Create TopNavBar component

**Files:**
- Create: `frontend/src/components/TopNavBar.tsx`

**Step 1: Build TopNavBar**

```tsx
import Link from 'next/link';

export default function TopNavBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 glass-effect shadow-[0_12px_32px_-8px_rgba(54,50,41,0.08)]">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="font-jua text-2xl text-primary">
          FairyWeave
        </Link>
        <nav className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className="font-jua text-lg tracking-tight text-secondary hover:text-primary transition-colors"
          >
            My Library
          </Link>
          <Link
            href="/create"
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-jua text-lg hover:opacity-90 transition-all active:scale-95"
          >
            Create Book
          </Link>
        </nav>
        <button className="md:hidden text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>
  );
}
```

**Step 2: Verify render**

Import and render in layout.tsx temporarily to confirm it renders. Remove after verification.

**Step 3: Commit**

```bash
git add frontend/src/components/TopNavBar.tsx
git commit -m "feat: add TopNavBar component with glass effect"
```

---

### Task 3: Create SideNavBar component for order flow

**Files:**
- Create: `frontend/src/components/SideNavBar.tsx`

**Step 1: Build SideNavBar**

```tsx
type StepKey = 'preview' | 'details' | 'shipping' | 'complete';

const SIDE_STEPS = [
  { key: 'preview' as const, label: 'Preview', icon: 'auto_stories' },
  { key: 'details' as const, label: 'Order Details', icon: 'receipt_long' },
  { key: 'shipping' as const, label: 'Shipping', icon: 'local_shipping' },
  { key: 'complete' as const, label: 'Confirmation', icon: 'auto_awesome' },
];

interface SideNavBarProps {
  currentStep: StepKey;
  onStepClick?: (step: StepKey) => void;
}

export default function SideNavBar({ currentStep, onStepClick }: SideNavBarProps) {
  const currentIdx = SIDE_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <aside className="hidden lg:flex flex-col py-8 h-screen w-64 border-r border-outline-variant/15 bg-surface-container-low sticky top-20 shrink-0">
      <div className="px-6 mb-8">
        <h2 className="text-primary font-jua text-xl">Your Journey</h2>
        <p className="text-secondary text-sm">Creating the magic</p>
      </div>
      <nav className="flex flex-col gap-2">
        {SIDE_STEPS.map((step, i) => {
          const isActive = step.key === currentStep;
          const isPast = i < currentIdx;
          const isFuture = i > currentIdx;

          return (
            <button
              key={step.key}
              onClick={() => isPast && onStepClick?.(step.key)}
              disabled={isFuture}
              className={`
                mx-2 px-4 py-3 flex items-center gap-3 rounded-full transition-all text-left
                ${isActive
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-medium'
                  : isFuture
                    ? 'text-secondary opacity-50 cursor-default'
                    : 'text-secondary hover:bg-surface-container-lowest/50 cursor-pointer'
                }
              `}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {step.icon}
              </span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/SideNavBar.tsx
git commit -m "feat: add SideNavBar component for order flow"
```

---

### Task 4: Create MobileBottomNav component

**Files:**
- Create: `frontend/src/components/MobileBottomNav.tsx`

**Step 1: Build MobileBottomNav**

```tsx
import Link from 'next/link';

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/80 glass-effect flex justify-around items-center py-3 px-6 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <Link href="/" className="flex flex-col items-center text-on-surface-variant">
        <span className="material-symbols-outlined">home</span>
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link href="/create" className="flex flex-col items-center text-primary">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_stories
        </span>
        <span className="text-[10px] font-medium">Create</span>
      </Link>
      <Link href="/" className="flex flex-col items-center text-on-surface-variant">
        <span className="material-symbols-outlined">favorite</span>
        <span className="text-[10px] font-medium">Wishlist</span>
      </Link>
      <Link href="/" className="flex flex-col items-center text-on-surface-variant">
        <span className="material-symbols-outlined">person</span>
        <span className="text-[10px] font-medium">My Page</span>
      </Link>
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/MobileBottomNav.tsx
git commit -m "feat: add MobileBottomNav component"
```

---

### Task 5: Create Footer component

**Files:**
- Create: `frontend/src/components/Footer.tsx`

**Step 1: Build Footer**

```tsx
export default function Footer() {
  return (
    <footer className="w-full rounded-t-xl bg-surface-container-low mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-jua text-2xl text-on-surface">FairyWeave</div>
          <p className="text-sm font-medium text-secondary">
            Hand-crafted with magic for the ones you love most.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Our Story
          </span>
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Shipping
          </span>
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Privacy
          </span>
          <span className="text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
            Help
          </span>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Footer.tsx
git commit -m "feat: add Footer component"
```

---

### Task 6: Update Button component with new color tokens

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`

**Step 1: Update variant styles to M3 tokens**

Replace hardcoded colors:

```typescript
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'watercolor-gradient text-on-primary hover:opacity-90',
  secondary: 'bg-secondary-container text-on-secondary-container hover:opacity-90',
  outline: 'bg-transparent text-primary border border-primary/20 hover:bg-surface-container',
  ghost: 'bg-transparent text-secondary hover:bg-surface-container-low',
  destructive: 'bg-transparent text-error border border-error hover:bg-error-container/20',
};
```

Update focus-visible outline from `#E8734A` to `primary`:

```
focus-visible:outline-primary
```

Update `lg` size to use `font-jua` utility instead of inline font-family:

```
lg: 'px-8 py-4 text-lg font-jua rounded-xl',
```

**Step 2: Verify buttons render**

Run dev server, check `/create` page buttons.
Expected: Primary button shows pink gradient, outline shows pink border.

**Step 3: Commit**

```bash
git add frontend/src/components/ui/Button.tsx
git commit -m "refactor: update Button to M3 color tokens"
```

---

### Task 7: Update StepIndicator to M3 design

**Files:**
- Modify: `frontend/src/components/StepIndicator.tsx`

**Step 1: Update colors**

Replace:
- Done: `bg-[#2D8A56]` -> `bg-primary`
- Active: `bg-[#E8734A]` -> `bg-tertiary`
- Inactive: `bg-[#E0D6CC]` -> `bg-outline-variant/30`
- Active text: `text-[#E8734A]` -> `text-tertiary`
- Inactive text: `text-[#9E9E9E]` -> `text-on-surface-variant`
- Done line: `bg-[#2D8A56]` -> `bg-primary`
- Inactive line: `bg-[#E0D6CC]` -> `bg-outline-variant/30`

**Step 2: Commit**

```bash
git add frontend/src/components/StepIndicator.tsx
git commit -m "refactor: update StepIndicator to M3 tokens"
```

---

### Task 8: Update BookCard to new gallery style

**Files:**
- Modify: `frontend/src/components/BookCard.tsx`

**Step 1: Redesign BookCard per mockup**

Replace the component to match the gallery card style from the homepage mockup. Key changes:
- Background: `bg-[#FDE8E8]` -> `bg-surface-container-lowest`
- Shadow: `shadow-sm hover:shadow-md` -> `shadow-sm hover:shadow-xl`
- Transition: add `duration-500`
- Padding: `p-3 sm:p-4` -> `p-8`
- Font: inline jua -> `font-jua`
- Theme chip: use `bg-secondary-container text-on-secondary-container` and `bg-tertiary-container text-on-tertiary-container`
- Focus outline: `#E8734A` -> `primary`
- Add description text in `text-secondary text-sm`

**Step 2: Commit**

```bash
git add frontend/src/components/BookCard.tsx
git commit -m "refactor: update BookCard to M3 gallery style"
```

---

### Task 9: Update PageLayout to support new shell

**Files:**
- Modify: `frontend/src/components/PageLayout.tsx`

**Step 1: Refactor PageLayout**

PageLayout becomes the general content wrapper. For the book/order flow, a separate layout shell with SideNav will be used inline. Update colors:

```tsx
interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export default function PageLayout({ children, className = '', wide = false }: PageLayoutProps) {
  return (
    <main id="main-content" className="min-h-screen bg-surface font-body text-on-surface">
      <div className={`mx-auto ${wide ? 'max-w-7xl' : 'max-w-4xl'} px-4 sm:px-6 py-8 sm:py-12 ${className}`}>
        {children}
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/PageLayout.tsx
git commit -m "refactor: update PageLayout with M3 tokens and wide option"
```

---

### Task 10: Redesign Home page (page.tsx)

**Files:**
- Modify: `frontend/src/app/page.tsx`

**Step 1: Rebuild home page per mockup**

Key structural changes from mockup:
1. Add TopNavBar + Footer imports
2. Hero: full-width with side-by-side layout (text left, image right on desktop)
   - Badge chip: `bg-tertiary-container text-on-tertiary-container`
   - H1: `font-jua text-5xl lg:text-7xl` with `<span className="text-primary italic">` for emphasis
   - Subtitle: `text-secondary text-lg`
   - Two CTAs: gradient primary + outline secondary
   - Hero image placeholder (use first dummy book cover or gradient placeholder)
3. Gallery: `bg-surface-container-low` section, 3-column grid, staggered offset on middle column (`mt-0 lg:mt-8`)
4. Bottom CTA: `bg-primary-container/20` rounded card with decorative blurs
5. Replace emoji hero with proper layout

Structure:
```tsx
<>
  <TopNavBar />
  <main className="pt-20">
    {/* Hero Section */}
    <section className="relative overflow-hidden px-6 lg:px-24 py-16 lg:py-32">
      ...
    </section>

    {/* Gallery Section */}
    <section className="py-24 px-6 bg-surface-container-low">
      ...
    </section>

    {/* Bottom CTA */}
    <section className="py-24 px-6 lg:px-24">
      ...
    </section>
  </main>
  <Footer />
</>
```

Remove PageLayout wrapper (home uses full-width layout).

**Step 2: Verify home page renders**

Run: `npm run dev`, visit `http://localhost:3000`
Expected: New design with TopNav, hero, gallery, CTA, footer.

**Step 3: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: redesign home page with M3 watercolor theme"
```

---

### Task 11: Redesign Book Preview step (book/[id]/page.tsx - preview)

**Files:**
- Modify: `frontend/src/app/book/[id]/page.tsx`

**Step 1: Add TopNavBar + SideNavBar shell**

Wrap the entire book page in a shell:

```tsx
<>
  <TopNavBar />
  <div className="flex pt-20 min-h-screen">
    <SideNavBar currentStep={step} onStepClick={(s) => setStep(s)} />
    <main className="flex-1 flex flex-col items-center px-4 py-12 md:px-12 bg-surface">
      {/* Step content here */}
    </main>
  </div>
  <Footer />
</>
```

**Step 2: Update preview step layout**

Per mockup (동화책 프리뷰):
- Step badge: `bg-secondary-container text-on-secondary-container`
- Title: `font-jua text-4xl md:text-5xl`
- PageSlider inside `bg-surface-container-low rounded-lg p-4 md:p-8 tonal-shadow`
- Story text area: quote marks + `font-jua text-2xl md:text-3xl`
- CTA button: `watercolor-gradient` full-width
- Bottom info cards: 3-column grid (주인공, 커스텀 일러스트, 프리미엄 하드커버)

**Step 3: Update all hardcoded colors**

Replace throughout the file:
- `#2D2D2D` -> `text-on-surface`
- `#5C5C5C` -> `text-secondary` or `text-on-surface-variant`
- `#FDE8E8` -> `bg-surface-container-low` or `bg-primary-container/20`
- `#E8734A` -> `primary`
- `#FFF8F0` -> `bg-surface`
- `#E0D6CC` -> `border-outline-variant`
- `#D14343` -> `text-error` or `border-error`
- `#2D8A56` -> `text-primary`

**Step 4: Commit**

```bash
git add frontend/src/app/book/[id]/page.tsx
git commit -m "feat: redesign book preview with M3 side-nav layout"
```

---

### Task 12: Redesign Details step (order summary)

**Files:**
- Modify: `frontend/src/app/book/[id]/page.tsx` (details section)

**Step 1: Update details step per mockup (주문 상세 확인)**

Key changes:
- 2-column layout: product card (left 2/3) + summary card (right 1/3)
- Product card: book cover image + metadata (author, page count, size)
- Summary card: price breakdown table + "배송 정보 입력하기" CTA
- Trust badges at bottom (Safe Payment, FSC Paper)
- Decorative quote section

**Step 2: Commit**

```bash
git add frontend/src/app/book/[id]/page.tsx
git commit -m "feat: redesign order details step with summary sidebar"
```

---

### Task 13: Redesign Shipping step

**Files:**
- Modify: `frontend/src/app/book/[id]/page.tsx` (shipping section)

**Step 1: Update shipping step per mockup (배송 정보 입력)**

Key changes:
- Form inputs: `bg-surface-container-highest border-none rounded-sm` with `focus:ring-primary/20`
- 2-column grid for name + phone
- Address section with "주소 찾기" button using `bg-secondary-container`
- Shipping memo as `<select>` dropdown
- Decorative image banner between form and CTA
- Footer actions: back button (left) + gradient CTA (right)
- Replace `border-[#D14343]` error -> `border-error`

**Step 2: Commit**

```bash
git add frontend/src/app/book/[id]/page.tsx
git commit -m "feat: redesign shipping form with M3 inputs"
```

---

### Task 14: Redesign Complete step

**Files:**
- Modify: `frontend/src/app/book/[id]/page.tsx` (complete section)
- Modify: `frontend/src/components/OrderSummary.tsx`

**Step 1: Update complete step per mockup (주문 완료)**

Key changes:
- Watercolor background with radial gradient blurs
- Large success icon: `material-symbols-outlined check_circle` in primary gradient circle
- Title: `font-jua text-4xl`
- Order summary card: grid layout with order number, product name, recipient, estimated delivery
- Two CTAs: "내 서재로 가기" (gradient) + "새 동화책 만들기" (outline)
- Remove confetti circles, replace with M3 decorative sparkles

**Step 2: Update OrderSummary component**

Restyle with M3 tokens:
- Background: `bg-surface-container-lowest`
- Border: `border-outline-variant/10`
- Grid layout for fields
- `text-outline` for labels

**Step 3: Commit**

```bash
git add frontend/src/app/book/[id]/page.tsx frontend/src/components/OrderSummary.tsx
git commit -m "feat: redesign order complete with M3 celebration style"
```

---

### Task 15: Update PageSlider with M3 styles

**Files:**
- Modify: `frontend/src/components/PageSlider.tsx`

**Step 1: Update PageSlider navigation and indicators**

- Arrow buttons: `bg-surface-container-lowest rounded-full tonal-shadow text-primary hover:bg-primary hover:text-on-primary`
- Page dots: active `bg-primary`, inactive `bg-outline-variant opacity-40`
- Page counter text: `text-on-surface-variant`

**Step 2: Commit**

```bash
git add frontend/src/components/PageSlider.tsx
git commit -m "refactor: update PageSlider to M3 tokens"
```

---

### Task 16: Update remaining components (ErrorBanner, FormField, ProgressBar)

**Files:**
- Modify: `frontend/src/components/ErrorBanner.tsx`
- Modify: `frontend/src/components/ui/FormField.tsx`
- Modify: `frontend/src/components/ProgressBar.tsx`

**Step 1: ErrorBanner**

Replace `#D14343` -> `error`, `#FDE8E8` -> `error-container/20`

**Step 2: FormField**

Replace label color, error color, required asterisk color with M3 tokens.

**Step 3: ProgressBar**

Replace `#E8734A` -> `primary`, background -> `surface-container`

**Step 4: Commit**

```bash
git add frontend/src/components/ErrorBanner.tsx frontend/src/components/ui/FormField.tsx frontend/src/components/ProgressBar.tsx
git commit -m "refactor: update ErrorBanner, FormField, ProgressBar to M3 tokens"
```

---

### Task 17: Update Create page colors

**Files:**
- Modify: `frontend/src/app/create/page.tsx`

**Step 1: Update create page**

- Add TopNavBar + Footer
- Replace all hardcoded colors with M3 tokens
- ThemeChip selection colors: selected border -> `border-primary`, selected bg -> `primary-container/30`
- Form background: `bg-surface-container-lowest`
- Loading skeleton: `bg-primary-container/20`

**Step 2: Update ThemeChip component**

Replace colors:
- Selected: `border-primary bg-primary-container/20`
- Default: `border-outline-variant bg-surface-container-lowest`

**Step 3: Commit**

```bash
git add frontend/src/app/create/page.tsx frontend/src/components/ThemeChip.tsx
git commit -m "refactor: update create page and ThemeChip to M3 tokens"
```

---

### Task 18: Final visual QA pass

**Step 1: Run dev server and check all pages**

- `http://localhost:3000` - Home: hero, gallery, CTA, footer
- `http://localhost:3000/create` - Create: form, theme selection, progress
- `http://localhost:3000/book/dummy-1` - Book: preview, details, shipping, complete

**Step 2: Check responsive breakpoints**

- Mobile (< 768px): No SideNav, BottomNav visible, single-column layouts
- Tablet (768-1024px): TopNav visible, no SideNav, adjusted grids
- Desktop (> 1024px): TopNav + SideNav visible, full layouts

**Step 3: Verify no hardcoded old colors remain**

Search for old color codes:
```bash
grep -rn "#E8734A\|#FDE8E8\|#FFF8F0\|#2D2D2D\|#5C5C5C\|#E0D6CC\|#D14343\|#9E9E9E\|#2D8A56" frontend/src/
```
Expected: No matches (all replaced with M3 tokens).

**Step 4: Commit any fixes**

```bash
git add -A frontend/src/
git commit -m "fix: clean up remaining old color references"
```

---

## Dependency Graph

```
Task 1 (Tailwind + tokens)
  ├── Task 2 (TopNavBar)
  ├── Task 3 (SideNavBar)
  ├── Task 4 (MobileBottomNav)
  ├── Task 5 (Footer)
  ├── Task 6 (Button update)
  ├── Task 7 (StepIndicator update)
  ├── Task 8 (BookCard update)
  └── Task 9 (PageLayout update)
        ├── Task 10 (Home page) ← depends on 2, 5, 8
        ├── Task 11 (Preview step) ← depends on 2, 3, 5, 15
        ├── Task 12 (Details step) ← depends on 11
        ├── Task 13 (Shipping step) ← depends on 12
        ├── Task 14 (Complete step) ← depends on 13
        ├── Task 15 (PageSlider)
        ├── Task 16 (ErrorBanner, FormField, ProgressBar)
        └── Task 17 (Create page) ← depends on 2, 5, 16
              └── Task 18 (QA pass) ← depends on all
```

## Estimated Scope

- **New components**: 4 (TopNavBar, SideNavBar, MobileBottomNav, Footer)
- **Modified components**: 9 (Button, StepIndicator, BookCard, PageLayout, PageSlider, ErrorBanner, FormField, ProgressBar, OrderSummary, ThemeChip)
- **Modified pages**: 3 (Home, Create, Book/[id])
- **Config changes**: 2 (tailwind.config.ts, globals.css, layout.tsx)
- **Business logic changes**: 0 (all API integration preserved as-is)

---

## /autoplan Review (2026-04-03)

Reviewed by: Claude (autoplan) | Mode: SELECTIVE EXPANSION | Branch: main
Codex: unavailable | Claude subagent: completed | Source: subagent-only

---

### Phase 1: CEO Review

#### 0A. Premise Challenge

| # | Premise | Verdict | Note |
|---|---------|---------|------|
| 1 | Design overhaul differentiates submission | ASSUMED | AI pipeline is the real differentiator; evaluator will spend ~60s |
| 2 | M3 tokens signal design maturity | VALID | Clean token system does show systems thinking |
| 3 | Frontend-only preserves backend stability | VALID | Zero backend changes in diff |
| 4 | "Business logic changes: 0" | RISKY | Rewriting every page touches adjacent logic (window.__bookCache, polling, routing) |
| 5 | Navigation shell adds value for 3-page app | QUESTIONABLE | TopNav+SideNav+BottomNav is 3 nav systems for 3 pages |

#### 0B. Existing Code Leverage

| Sub-problem | Existing Code | Reused? |
|-------------|---------------|---------|
| Color tokens | globals.css @theme inline | Yes, extended |
| Navigation | None (back buttons only) | New build |
| Page layouts | PageLayout.tsx | Partially (home bypasses it) |
| Icon system | lucide-react | Replaced with Material Symbols (added dependency) |
| Gallery showcase | None | New build |

#### 0C. Dream State Delta

```
CURRENT: Coral theme, no nav, basic centered layouts
THIS PLAN: M3 tokens, TopNav shell, gallery home, 4-step order flow
GAP TO IDEAL: Dark mode, component Storybook, animation system, print-aware design
```

The plan moves toward the ideal but the gap is large. For a hiring demo, this level is sufficient.

#### CLAUDE SUBAGENT (CEO — strategic independence) [subagent-only]

Key concerns (severity):
1. **HIGH**: Over-investment in visual chrome (18 tasks for 3-page demo)
2. **HIGH**: Simpler alternatives (CSS variable swap) not evaluated in plan
3. **CRITICAL**: Regression risk from touching every page component
4. **MEDIUM**: Footer brand mismatch ("Starlight Fairytale" != "FairyWeave")
5. **MEDIUM**: Dead footer links, phantom MobileBottomNav routes
6. **MEDIUM**: Background color change is 1 hex digit (#FFF8F0 -> #fff8f1)

CEO DUAL VOICES — CONSENSUS TABLE:
```
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   MIXED   N/A    FLAGGED
  2. Right problem to solve?           PARTIAL N/A    FLAGGED
  3. Scope calibration correct?        OVER    N/A    FLAGGED
  4. Alternatives sufficiently explored? NO    N/A    FLAGGED
  5. Competitive/market risks covered? YES     N/A    N/A
  6. 6-month trajectory sound?         YES     N/A    N/A
```

#### Section 1: Architecture Review

```
  TopNavBar ─── layout.tsx (not used, each page renders TopNavBar)
  SideNavBar ── book/[id]/page.tsx only
  Footer ────── each page renders individually
  
  Home (page.tsx) ── TopNavBar + gallery + CTA + Footer
  Create ─────────── TopNavBar + form + Footer
  Book/[id] ──────── TopNavBar + SideNavBar + 4-step flow + Footer
```

Finding: No shared layout shell. TopNavBar and Footer are imported in every page separately. If a 4th page is added, dev must remember to add both. The plan's Task 9 (PageLayout update) wasn't used for the home page.

Auto-decided: DEFER. For a 3-page demo, individual imports are fine. P5 explicit over clever. Logged.

#### Section 2: Error & Rescue Map

| METHOD/CODEPATH | WHAT CAN GO WRONG | RESCUED? | USER SEES |
|-----------------|-------------------|----------|-----------|
| Book fetch (useEffect) | 404 from API | Y | Expired/error UI |
| Book fetch | Network failure | Y | Generic error |
| Order submit | API timeout | Y | Error banner |
| Polling (status) | Network error | PARTIAL | `catch {}` swallows silently |
| Gallery images | External URL 404 | N ← GAP | Broken img |
| Material Symbols font | CDN failure | N ← GAP | Missing icons (□) |

**GAP**: `catch {}` empty catch in create/page.tsx:108 swallows network errors during polling. Should log or set retry counter.
**GAP**: Gallery images depend on external Google URLs. No fallback img or error state.
**GAP**: Material Symbols loaded via external CDN. No local fallback font.

Auto-decided: Flag gallery image fallback and empty catch as fixes. P1 completeness. Logged.

#### Section 3: Security

Finding: No new attack surface from the design migration. All security concerns are pre-existing (prompt injection, input sanitization) and already tracked in TODOS.md #2.

Examined: No new form inputs, no new API endpoints, no new data flows. The design overhaul is cosmetic only.

#### Section 4: Data Flow & Interaction Edge Cases

| INTERACTION | EDGE CASE | HANDLED? |
|-------------|-----------|----------|
| Hamburger menu (mobile) | Click | NO ← GAP (no onClick handler) |
| SideNavBar future step | Click | YES (disabled) |
| SideNavBar past step | Click | YES (onStepClick) |
| Gallery card | Click | NO ← GAP (not clickable, just visual) |
| Footer links | Click | NO ← GAP (span, not anchor) |

**GAP**: Hamburger menu button (TopNavBar.tsx:24-26) has no onClick handler. On mobile, tapping the menu icon does nothing.
**GAP**: Footer links are `<span>` elements with cursor-pointer but no navigation.
**GAP**: Gallery cards are not links. Users will try to click them expecting to see the book.

Auto-decided: Hamburger menu and footer links are P1 completeness fixes. Gallery cards are P3 pragmatic (link to /create or /book/dummy-N). Logged.

#### Section 5: Code Quality

1. **Hardcoded colors despite token system**: TopNavBar uses `bg-[#fff8f1]/80`, Footer uses `bg-[#faf2e9]`, home hero uses `bg-[radial-gradient(circle_at_top_right,#faf2e9_0%,#fff8f1_70%)]`. Should use `bg-surface/80`, `bg-surface-container-low`, and token references.
2. **Language inconsistency**: SideNavBar labels are English ("Preview", "Order Details", "Shipping", "Confirmation"). Rest of app is Korean. Header text "Your Journey" / "Creating the magic" is also English.
3. **Brand inconsistency**: Footer says "Starlight Fairytale" and "© 2024 The Living Heirloom" instead of "FairyWeave".
4. **Step badge inconsistency**: Preview step uses `STEP 1 / 4` badge, Details step uses `Step 2 of 4` text. Different format.

Auto-decided: All four are P1 completeness + P5 explicit fixes. Logged.

#### Section 6: Test Review

```
NEW UX FLOWS:
  - Home gallery browsing
  - TopNavBar navigation (desktop + mobile hamburger)
  - SideNavBar step navigation
  - 4-step order flow (preview → details → shipping → complete)

NEW DATA FLOWS:
  - None (all existing)

NEW CODEPATHS:
  - Gallery card rendering with external images
  - SideNavBar step state management
  - Responsive breakpoint behavior (lg:hidden, md:hidden)

NEW ERROR/RESCUE PATHS:
  - Book load error/expired UI
```

No tests exist in the plan or codebase for the new UI components. For a hiring demo, this is acceptable.

Auto-decided: DEFER testing. P6 bias toward action. Logged.

#### Section 7: Performance

1. Gallery loads 5 high-res images from external Google URLs on home page. No lazy loading, no srcset. First paint could be slow.
2. Material Symbols font is loaded on every page even when few icons are used. Font size is ~200KB.

Auto-decided: Flag lazy loading as improvement. P3 pragmatic. Logged.

#### Section 8: Observability

For a demo app, no observability infrastructure is needed. Examined logging, metrics, tracing. Nothing flagged.

#### Section 9: Deployment

Local demo only (npm run dev). No deployment pipeline. No migration safety concerns (frontend-only changes, no DB).

#### Section 10: Long-Term Trajectory

Technical debt introduced: hardcoded colors in 3 locations, English/Korean language split, brand name mismatch. Reversibility: 4/5 (git revert ec52352).

#### Section 11: Design & UX Review

Information architecture: TopNavBar → Hero → Gallery → CTA → Footer. Good hierarchy. SideNavBar for book flow is appropriate.

Interaction state coverage:
| FEATURE | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---------|---------|-------|-------|---------|---------|
| Home gallery | ✗ | ✗ | ✗ | ✓ | ✗ |
| Book preview | ✓ | ✗ | ✓ | ✓ | ✗ |
| Create form | ✓ | ✓ | ✓ | ✓ | ✗ |

Missing states: Home gallery has no loading skeleton (server component, static data) and no error state for broken images.

### NOT in scope (deferred)
- MobileBottomNav (plan Task 4) was not implemented. Auto-decided: CORRECT. Phantom Wishlist/MyPage links would be worse than no BottomNav. P5 explicit.
- Dark mode, animation system, Storybook documentation

### What already exists
- Tailwind v4 @theme inline system for tokens
- Component library (Button, FormField, ThemeChip, etc.)
- Next.js routing and layout system

### Dream state delta
Plan closes ~40% of the gap between coral theme and ideal design system. Token foundation is solid. Navigation shell exists. Gallery showcase added. Remaining: dark mode, component documentation, print-aware design, full responsive testing.

### Failure Modes Registry

| Mode | Trigger | Impact | Mitigated? |
|------|---------|--------|------------|
| Broken icons | Material Symbols CDN failure | Missing icons across all pages | NO |
| Broken gallery | Google image URLs expire/change | Blank images on homepage | NO |
| Dead hamburger | Mobile user taps menu | Nothing happens, user stuck | NO |
| Brand confusion | Footer shows wrong brand name | Evaluator questions attention to detail | NO |

---

### Phase 2: Design Review [subagent-only]

Design completeness: 6/10. Good token foundation, but inconsistencies undermine it.

#### Pass 1: Visual Consistency (5/10)
- 3 hardcoded color values bypass the token system
- Step badge format changes between steps
- English/Korean language split in SideNavBar

#### Pass 2: Information Hierarchy (8/10)
- Home page hierarchy is strong: badge → headline → subtitle → CTAs → gallery → CTA
- Book flow with SideNavBar provides clear step progression

#### Pass 3: Interaction States (5/10)
- Hamburger menu is a dead button
- Footer links are fake clickables
- Gallery cards are not interactive
- No hover/focus states on gallery cards

#### Pass 4: Responsive Design (7/10)
- SideNavBar correctly hides on mobile (hidden lg:flex)
- TopNavBar shows hamburger on mobile (but it's dead)
- Gallery switches to single column on mobile

#### Pass 5: Accessibility (5/10)
- Gallery images have alt text (good)
- No skip navigation in new layout (was in old PageLayout via skip-link)
- Hamburger button has no aria-label
- SideNavBar disabled buttons could benefit from aria-disabled

#### Pass 6: Design System Coherence (7/10)
- Token system is comprehensive (50+ M3 tokens)
- Consistent use of font-jua, material-symbols
- Watercolor gradient as brand element works

#### Pass 7: Micro-interactions (6/10)
- Good: hover:opacity-90, active:scale-95 on CTAs
- Good: group-hover:scale-110 on gallery images
- Missing: no animation on step transitions in SideNavBar

---

### Phase 3: Eng Review [subagent-only]

#### Architecture Diagram

```
  layout.tsx (fonts, metadata)
  ├── page.tsx (Home)
  │   ├── TopNavBar
  │   ├── Hero + Gallery (static data, external images)
  │   └── Footer
  ├── create/page.tsx
  │   ├── TopNavBar
  │   ├── Form → POST /api/generate-book → poll status → redirect
  │   └── Footer
  └── book/[id]/page.tsx
      ├── TopNavBar
      ├── SideNavBar (lg only)
      ├── 4 steps: preview → details → shipping → complete
      │   └── preview: PageSlider + story text
      │   └── details: product card + summary
      │   └── shipping: form → POST /api/sweetbook/order
      │   └── complete: success + order summary
      └── Footer
```

No new backend routes. No new API surfaces. The architecture is sound for a demo app.

#### Test Plan

No tests exist for UI components. For a hiring demo with 5 days remaining, test investment should go to the API integration, not UI snapshots.

Deferred to TODOS.md.

#### Cross-Phase Themes

**Theme 1: Inconsistency** — flagged in Phase 1 (code quality), Phase 2 (visual consistency). Hardcoded colors, mixed languages, wrong brand name. High-confidence signal.

**Theme 2: Dead interactions** — flagged in Phase 1 (edge cases), Phase 2 (interaction states). Hamburger menu, footer links, gallery cards. Three places where users can interact but nothing happens.

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Mode: SELECTIVE EXPANSION | Mechanical | P3 | Feature enhancement on existing system | EXPANSION, HOLD |
| 2 | CEO | Accept architecture (no shared layout) | Mechanical | P5 | 3 pages, individual imports are explicit | Shared layout wrapper |
| 3 | CEO | Flag empty catch as fix | Mechanical | P1 | Silent error swallowing is always wrong | Ignore |
| 4 | CEO | Flag gallery image fallback | Taste | P1 | External dependency without fallback | Defer |
| 5 | CEO | Flag hamburger menu as fix | Mechanical | P1 | Dead button is always a bug | Defer |
| 6 | CEO | Flag footer links as fix | Mechanical | P1 | Fake clickables are always a bug | Defer |
| 7 | CEO | Flag hardcoded colors as fix | Mechanical | P4 | Token system exists, use it (DRY) | Ignore |
| 8 | CEO | Flag language inconsistency as fix | Mechanical | P5 | Korean app with English sidebar is confusing | Ignore |
| 9 | CEO | Flag brand name as fix | Mechanical | P1 | Wrong brand name in footer is critical for demo | Ignore |
| 10 | CEO | Defer MobileBottomNav | Mechanical | P5 | Phantom routes worse than no nav | Build it |
| 11 | CEO | Defer testing | Mechanical | P6 | Demo app, deadline Apr 8 | Write tests |
| 12 | Design | All 7 dimensions scored | Mechanical | P1 | Full evaluation required | Skip |
| 13 | Eng | Defer test plan | Mechanical | P6 | API tests more valuable than UI tests | Write UI tests |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 2 | issues_open → fixed | 6 findings (auto-decided) |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | N/A (codex unavailable) | — |
| Eng Review | `/plan-eng-review` | Architecture & tests | 2 | clean | 7 issues found, all fixed |
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | issues_open → fixed | 7 dimensions scored (avg 6.1/10) |
| Autoplan Voices (CEO) | autoplan | Dual-voice consensus | 1 | subagent-only | 2/6 confirmed, 4 flagged |
| Autoplan Voices (Eng) | autoplan | Dual-voice consensus | 1 | subagent-only | N/A (codex unavailable) |
| Autoplan Voices (Design) | autoplan | Dual-voice consensus | 1 | subagent-only | N/A (codex unavailable) |

**VERDICT:** APPROVED with 7 fixes applied. All fixes verified (build passes). Next: `/ship` when ready.
