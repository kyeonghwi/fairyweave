# TODOS

Items deferred from /plan-eng-review on 2026-04-03.

## Deferred

### 1. bookStore TTL + size cap
- **What:** Add 30-minute TTL and 20-book cap to in-memory Map
- **Why:** Prevents OOM during extended demo (10 books = 80-320MB of base64)
- **Context:** bookStore.ts:4, add eviction logic on save(), check timestamp on get()
- **Depends on:** Nothing

### 2. Prompt injection guard
- **What:** Sanitize childName/theme/moral before injecting into Gemini prompt
- **Why:** Kids' platform, user strings go directly into LLM prompt
- **Context:** storyGenerator.ts:15-19, add length limits + strip control characters on backend
- **Depends on:** Nothing

### 3. Consistent backend URL strategy
- **What:** Unify frontend API calls to use relative paths (Next.js proxy) everywhere
- **Why:** create/page.tsx uses NEXT_PUBLIC_BACKEND_URL, book/[id]/page.tsx uses relative /api/
- **Context:** create/page.tsx:94, book/[id]/page.tsx:86, next.config rewrites
- **Depends on:** Verify Next.js proxy handles all backend routes

### 4. BLANK_TEMPLATE_UID to env var
- **What:** Move hardcoded '2mi1ao0Z4Vxl' to SWEETBOOK_BLANK_TEMPLATE_UID env var
- **Why:** Cover and content template UIDs are env vars, blank is hardcoded magic string
- **Context:** sweetbook.ts:98, .env.example
- **Depends on:** Nothing

### 5. Age range mismatch
- **What:** Align frontend age dropdown (1-10) with backend validation (1-12)
- **Why:** Backend allows 11-12 but frontend can't select them
- **Context:** create/page.tsx:198 (length: 10), generate.ts:113 (age > 12)
- **Depends on:** Decide correct range (1-10 or 1-12)

### 6. ARIA landmark + skip nav
- **What:** Change PageLayout outer div to `<main>`, add skip navigation link
- **Why:** Screen readers can't navigate to main content, Lighthouse flags it
- **Context:** PageLayout.tsx, 2-line change
- **Depends on:** Nothing

### 8. 주문 플로우 4단계 확장 (Preview → 주문 상세 → 배송 정보 → 주문 완료)
- **What:** 현재 3단계(preview → order → complete)를 4단계로 분리
- **Why:** 각 단계별 역할을 명확히 하고 사용자 경험 개선
- **Steps:**
  1. **동화책 프리뷰** — 슬라이더 기반 삽화+스토리 확인 (기존 preview)
  2. **주문 상세 확인** — 상품 사양(16페이지, 제본, 크기)과 결제 금액을 카드 UI로 표시 (신규)
  3. **배송 정보 입력** — 기존 order 폼을 따뜻한 컬러 톤과 둥근 모서리로 유지 (기존 order 리네임)
  4. **주문 완료** — 축하 메시지 + 주문 요약 (기존 complete)
- **Context:** book/[id]/page.tsx — Step 타입에 'details' 추가, StepIndicator 컴포넌트 신규
- **Depends on:** Nothing

### 9. Auto-save draftPages per 완료 to backend
- **What:** On each [완료] click in story-review Stage 2, PATCH /story with current draftPages
- **Why:** Prevents session loss from browser refresh during mobile editing
- **Context:** story-review/[id]/page.tsx — add PATCH call in closePanel after commit
- **Depends on:** Nothing (PATCH /story already handles partial saves)

### 7. Touch target size
- **What:** Increase PageSlider arrow buttons from 40px to 44px (w-10 → w-11)
- **Why:** Below iOS 44px minimum touch target guideline
- **Context:** PageSlider.tsx lines 96-118, change w-10 h-10 → w-11 h-11
- **Depends on:** Nothing
