# Phase 4: Frontend UI + Dummy Data — Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 쓸 수 있는 완전한 UI + 즉시 실행 가능한 더미 데이터. 메인 페이지 → 생성 → 프리뷰 → 주문 → 완료 전체 플로우 구현. 더미북 5권은 AI 생성 없이 바로 Books API + Orders API 호출 가능해야 한다.

**Deliverables:**
- 메인 페이지: Hero 섹션 + 더미북 갤러리(카드 그리드) + CTA
- `/create` 페이지: 생성 폼(테마 칩 선택형) + 로딩 상태
- `/book/[id]` 페이지: 프리뷰 슬라이더 → 주문 폼 → 완료 화면 (step 전환)
- `dummyData.json`: 5권 × (커버 AI 이미지 + 대표 2페이지 AI 이미지 + 13페이지 placeholder)
- 전용 엔드포인트: `POST /api/sweetbook/books-from-data`

**Done when:** 더미북 선택 → 프리뷰 확인 → 배송 정보 입력 → 주문 완료(orderUid 표시)까지 AI 생성 없이 동작한다.

</domain>

<decisions>
## Implementation Decisions

### 페이지 구조 (하이브리드 라우팅)
- **D-01:** `/` — Home (Hero + 갤러리 + CTA)
- **D-02:** `/create` — 생성 폼 + AI 로딩 상태
- **D-03:** `/book/[id]` — 프리뷰 → 주문 → 완료를 step 전환으로 처리 (URL 하나에서 state로 전환)
- AI 생성 북과 더미북 모두 `/book/[id]`에서 동일한 프리뷰→주문 플로우를 탐

### 더미북 동선
- **D-04:** 갤러리에서 더미북 카드 클릭 → `/book/[dummyId]` → 프리뷰 → 주문 폼 → 완료
- 더미북은 프론트엔드 로컬 데이터 (`dummyData.json` import)
- 주문 시점에 백엔드로 pages + imageUrls + shipping 전송

### 메인 페이지 레이아웃
- **D-05:** 상단 Hero 섹션 (서비스 소개 + "내 아이 동화책 만들기" CTA 버튼)
- **D-06:** 중간에 "인기 동화책" 갤러리 — 더미북 5권 카드 그리드 (커버 이미지 + 제목 + 테마)
- **D-07:** 하단에 "직접 만들어 보세요" CTA 영역

### 더미 데이터 전략
- **D-08:** 이미지: 권당 커버 1장 + 대표 페이지 2장 = 15장만 Gemini AI 생성. 나머지 13페이지는 컬러 placeholder
- **D-09:** Phase 4 코드 작성 전에 Gemini로 사전 생성하여 dummyData.json에 저장
- **D-10:** 더미 데이터는 프론트엔드에만 존재. 백엔드 bookStore에는 등록하지 않음
- **D-11:** 콘텐츠(테마/스토리): Claude가 다양한 테마(공룡, 우주, 마법, 바다, 숲 등)로 5권 자동 구성

### 주문용 전용 엔드포인트
- **D-12:** `POST /api/sweetbook/books-from-data` — body로 pages + imageUrls + shipping을 한 번에 받아 book 생성 + 주문 처리
- 기존 `POST /api/sweetbook/books` (bookId 기반, bookStore 경유)와 별도 경로
- AI 생성 북 주문에도 재사용 가능 (프론트엔드가 generate-book 응답 데이터를 직접 전송)

### UI 톤 & 비주얼
- **D-13:** 따뜻한 동화풍 — 파스텔 색상(soft pink, warm orange, cream, soft purple, mint)
- **D-14:** 둥근 모서리 (rounded-2xl), 둥근 폰트
- **D-15:** 한글 폰트: Claude 재량으로 동화풍에 맞게 선택 (Google Fonts)
- **D-16:** 갤러리: 카드 그리드 (2~3열), 커버 이미지 + 제목 + 테마 표시

### 생성 폼
- **D-17:** 테마 칩 선택형 — 이모지 + 테마명 버튼 (🦕공룡, 🚀우주, 🧙마법, 🌊바다 등) + "직접 입력" 칩
- **D-18:** 나이는 드롭다운, 이름/교훈은 텍스트 입력
- **D-19:** 필수 필드 누락 시 클라이언트 사이드 검증 (FORM-03)

### 책 프리뷰 슬라이더
- **D-20:** 이미지 중심 레이아웃 — 상단 2/3 삽화 이미지, 하단 스토리 텍스트 + 페이지 네비게이션 (◀ 3/16 ▶)

### 로딩 상태
- **D-21:** 스켈레톤 배경 + 단계별 진행 텍스트 오버레이 합치기
- "스토리 쓰는 중..." → "삽화 그리는 중 (5/16)..." → "거의 다 되었어요!" 형태의 진행 피드백
- 진행률 바 포함

### 에러 상태
- **D-22:** Claude 재량 — 상황에 따라 인라인 알림 또는 전용 화면으로 적절히 처리
- 재시도 버튼은 필수

### 주문 완료 화면
- **D-23:** orderUid + 주문 요약(책 제목, 배송지) 표시
- "또 만들기" + "메인으로" 버튼 제공

### Claude's Discretion
- 한글 폰트 구체적 선택
- 에러 상태 UI 세부 구현
- 파스텔 색상 정확한 값
- 프리뷰 슬라이더 애니메이션
- placeholder 이미지 디자인 (컬러 + 텍스트)
- `/book/[id]` 내부 step 전환 방식 (state vs URL query)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 4 — deliverables, done-when criteria
- `.planning/REQUIREMENTS.md` §Input Form (FORM-01~03), §Preview & Order Flow (UI-01~03), §Dummy Data (DUM-01~03), §AI Generation (AI-04)

### Backend API (already implemented)
- `backend/src/routes/generate.ts` — `POST /api/generate-book` (full pipeline), `GET /api/books/:id`
- `backend/src/routes/sweetbook.ts` — `POST /api/sweetbook/books` (bookId-based), `POST /api/sweetbook/orders` (shipping fields)
- `backend/src/types/story.ts` — `GenerateStoryRequest`, `BookRecord`, `StoryPage` types
- `backend/src/services/bookStore.ts` — in-memory Map store, `bookStore.save/get/list`

### Frontend baseline
- `frontend/src/app/layout.tsx` — Root layout with lang="ko", metadata
- `frontend/src/app/page.tsx` — Current placeholder (replace with Home)
- `frontend/AGENTS.md` — Next.js 16 breaking changes warning, read `node_modules/next/dist/docs/` before implementing

### Prior phase decisions
- `.planning/phases/03-sweetbook-api-integration/03-CONTEXT.md` — Sweetbook API integration details, shipping fields, order idempotency

</canonical_refs>

<specifics>
## Specific Ideas

- 테마 칩에 "직접 입력" 옵션 추가 — FORM-01 요구사항 충족 + 대부분 사용자는 칩으로 빠르게 진행
- 더미북은 프론트엔드 로컬이므로 서버 재시작과 무관하게 항상 갤러리 표시
- `books-from-data` 엔드포인트로 더미북/AI북 주문 경로 통일 가능
- 프리뷰 슬라이더 키보드 좌우 화살표 지원 고려

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GenerateStoryRequest` type (backend): `{ childName, age, theme, moral }` — 프론트엔드 폼 타입과 동일 구조, 미러링 필요
- `BookRecord` type (backend): `{ id, request, pages, imageUrls, createdAt }` — 프리뷰/갤러리 렌더링에 필요한 모든 필드 포함
- `StoryPage` type: `{ pageNumber, text, imagePrompt }` — 프리뷰 슬라이더에서 text + imageUrls[i] 매핑

### Established Patterns
- Backend router pattern: `Router()` + `router.post/get` + export named router
- Express JSON body parsing: `req.body as Type` 패턴
- Error responses: `{ error: string, ...details }` 형태

### Integration Points
- `POST /api/generate-book`: body `GenerateStoryRequest` → response `{ bookId, pages, imageUrls }`
- `GET /api/books/:id`: response `BookRecord`
- `POST /api/sweetbook/books`: body `{ bookId }` → response `{ bookUid }`
- `POST /api/sweetbook/orders`: body `{ bookUid, recipientName, recipientPhone, postalCode, address1, address2?, shippingMemo? }` → response `{ orderUid }`
- 새로 만들 `POST /api/sweetbook/books-from-data`: body `{ pages, imageUrls, request, shipping }` → response `{ bookUid, orderUid }`

</code_context>

<deferred>
## Deferred Ideas

- 주문 상태 폴링/Webhook → Phase 5 이후 (ENH-03)
- 생성된 스토리 텍스트 인라인 편집 → v2 (ENH-02)
- 캐릭터 일관성 고도화 → v2 (ENH-01)
- 반응형 모바일 최적화 → Phase 5에서 필요 시 추가
- 다크 모드 → 불필요 (채용 과제 범위 아님)

</deferred>

---

*Phase: 04-frontend-ui-dummy-data*
*Context gathered: 2026-04-02*
