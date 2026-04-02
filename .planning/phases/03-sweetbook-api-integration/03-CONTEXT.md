# Phase 3: Sweetbook API Integration — Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Sweetbook SDK 설치 및 Books API + Orders API 완전 연동. 백엔드 전용 페이즈 — UI 없음.

**Deliverables:**
- `bookprintapi-nodejs-sdk` npm 설치 + SweetbookClient 초기화
- 4-step book creation: `books.create` → `photos.upload` (16장) → `covers.create` → 16× `contents.insert` → `books.finalize`
- `POST /api/sweetbook/books` — 내부 bookId → Sweetbook bookUid 반환
- `POST /api/sweetbook/orders` — bookUid + 배송 정보 → orderUid 반환
- 환경변수 기반 sandbox/live 분기

**Done when:** Sweetbook 샌드박스에서 주문 접수가 확인되고 orderUid가 반환된다.

</domain>

<decisions>
## Implementation Decisions

### Book spec & template UIDs
- `bookSpecUid`: 하드코딩 `SQUAREBOOK_HC` (SDK 예제 기준)
- Cover templateUid: 샌드박스에서 1회 확인 후 `SWEETBOOK_COVER_TEMPLATE_UID` 환경변수에 저장
- Content templateUid: 샌드박스에서 1회 확인 후 `SWEETBOOK_CONTENT_TEMPLATE_UID` 환경변수에 저장
- 환경변수 누락 시 서버 시작 즉시 에러로 명시적 실패 (silent fallback 없음)

### Book creation flow (4 steps — one backend operation)
1. `client.books.create({ bookSpecUid: 'SQUAREBOOK_HC', title, creationType: 'TEST' })` → `bookUid`
2. 16장 이미지: base64 data URI → Node.js `Blob` 변환 → `client.photos.upload(bookUid, blob)` 각각 업로드 → URL/fileName 수집
3. `client.covers.create(bookUid, COVER_TEMPLATE_UID, { coverPhoto: firstImageUrl, title })`
4. 16× `client.contents.insert(bookUid, CONTENT_TEMPLATE_UID, { photo: imageUrl, text }, { breakBefore: 'page' })`
5. `client.books.finalize(bookUid)`

### Image handling
- 우리 imageUrls는 `data:image/png;base64,...` 형태
- Sweetbook 템플릿 파라미터는 URL 문자열 요구
- 해결: `client.photos.upload`로 Sweetbook 자체 포토 라이브러리에 업로드 → 반환된 URL 사용
- base64 → Blob 변환은 Node.js에서 `Buffer.from(base64, 'base64')` + `new Blob([buffer])` 패턴

### Failure handling
- book creation 4-step 중 어느 단계라도 실패 시: `client.books.delete(bookUid)` 호출 후 에러 반환
- 부분 상태(dangling draft) 프론트엔드에 노출하지 않음
- `bookUid` 없이 실패한 경우(1단계 실패)는 삭제 불필요

### Internal API routes
- `POST /api/sweetbook/books` — body: `{ bookId: string }` (우리 내부 ID) → 위 4-step 실행 → `{ bookUid: string }`
- `POST /api/sweetbook/orders` — body: `{ bookUid, recipientName, recipientPhone, postalCode, address1, address2?, shippingMemo? }` → `{ orderUid: string }`
- generate-book 엔드포인트에는 Sweetbook 호출 추가하지 않음 (생성과 제출은 분리)

### Order idempotency
- SDK의 `externalRef` 필드 사용 (HTTP 헤더 아님)
- `externalRef` = UUIDv4 — 매 주문 요청마다 백엔드에서 생성
- 요구사항의 "Idempotency-Key(UUIDv4)"는 `externalRef`로 충족

### Order shipping fields (from SDK)
- 필수: `recipientName`, `recipientPhone`, `postalCode`, `address1`
- 선택: `address2`, `shippingMemo`
- 국가 코드 등 추가 필드는 SDK 예제에 없음 — 기본값 없음

### Environment variables (추가)
- `SWEETBOOK_API_KEY` — 기존
- `SWEETBOOK_ENV` — `sandbox` | `live` (기본: `sandbox`)
- `SWEETBOOK_COVER_TEMPLATE_UID` — 샌드박스 확인 후 설정
- `SWEETBOOK_CONTENT_TEMPLATE_UID` — 샌드박스 확인 후 설정

### SDK installation
- Package: `bookprintapi-nodejs-sdk` (GitHub: sweet-book/bookprintapi-nodejs-sdk)
- Node.js 18+ 필요 (내장 fetch 사용) — 현재 환경 충족
- `creationType: 'TEST'` — 샌드박스 테스트용

### Claude's Discretion
- base64 → Blob 변환 구현 세부 (Buffer 패턴)
- SweetbookClient 싱글톤 vs 요청마다 생성
- TypeScript 타입 래핑 수준
- 에러 로깅 포맷

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SDK & API
- `https://github.com/sweet-book/bookprintapi-nodejs-sdk` — SDK README (설치, 환경변수, 에러 처리)
- SDK `examples/01_create_book.js` — book create → cover → contents → finalize 흐름
- SDK `examples/02_order.js` — credit check → estimate → order create 흐름
- SDK `lib/client.js` — 실제 메서드 시그니처 (특히 `photos.upload`, `covers.create`, `contents.insert`)

### Project planning
- `.planning/ROADMAP.md` §Phase 3 — deliverables, done-when criteria
- `.planning/REQUIREMENTS.md` §Sweetbook Integration — SB-01~SB-05

### Existing backend
- `backend/src/routes/generate.ts` — 기존 라우터 구조, bookStore 사용 패턴
- `backend/src/services/bookStore.ts` — `bookStore.get(id)` → BookRecord (imageUrls, pages 포함)
- `backend/src/types/story.ts` — BookRecord 타입 (imageUrls는 base64 data URI 배열)

</canonical_refs>

<specifics>
## Specific Ideas

- SDK 예제의 `bookSpecUid: 'SQUAREBOOK_HC'` 그대로 사용
- `creationType: 'TEST'` — 샌드박스에서 실제 충전금 차감 없이 테스트 가능
- 샌드박스 충전금 부족 시: `client.credits.sandboxCharge(100000, '테스트 충전')` 호출 (Phase 3 테스트 중 1회)
- `externalRef` 형식: `FW-${uuidv4()}` 또는 단순 UUIDv4

</specifics>

<deferred>
## Deferred Ideas

- 주문 상태 폴링/Webhook → Phase 5 이후 (ENH-03)
- `client.orders.estimate` 견적 표시 → Phase 4 UI에서 고려 가능 (Phase 3 스코프 아님)
- 사진 업로드 병렬화 최적화 → Phase 3에서는 순차 업로드도 허용
- bookUid를 내부 BookRecord에 저장하는 영속화 → Phase 3에서는 응답으로만 반환, 저장은 Phase 4에서 필요시

</deferred>

---

*Phase: 03-sweetbook-api-integration*
*Context gathered: 2026-04-01*
