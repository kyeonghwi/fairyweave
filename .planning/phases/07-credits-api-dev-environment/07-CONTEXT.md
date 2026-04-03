# Phase 7: Credits API + Dev Environment - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Credits API로 주문 전 잔액 검증 추가, book-specs 로컬 엔드포인트 노출, concurrently 단일 명령 실행 환경 확인.
주문 UI 자체는 변경하지 않는다 — 백엔드 검증 레이어 추가가 핵심.

</domain>

<decisions>
## Implementation Decisions

### Concurrently 설정
- **D-01:** 이미 완료 — 루트 `package.json`에 `concurrently ^8.2.2` 설치됨, `npm run dev`가 프론트(3000) + 백(3001) 동시 실행
- 이 deliverable은 플래닝/구현 작업 불필요

### Credits 잔액 확인 방식
- **D-02:** `GET /credits` 대신 `POST /orders/estimate` 사용 — 잔액 충분 여부(`creditSufficient`) + 가격 견적을 한 번에 반환하므로 더 효율적
- **D-03:** 확인 시점: 백엔드 주문 생성 함수(`POST /api/sweetbook/orders`, `POST /api/sweetbook/books-from-data`) 내부에서 자동 처리 — 프론트엔드 추가 호출 불필요
- **D-04:** `creditSufficient: false`이면 HTTP 402 반환, 메시지: `"크레딧 잔액이 부족합니다. Sweetbook 파트너 포털에서 충전 후 다시 시도해주세요. (필요: {required}원, 현재: {available}원)"`
- **D-05:** 프론트엔드 UI에 잔액 표시 없음 — 에러 발생 시에만 메시지 노출
- **D-06:** `sweetbook.d.ts`에 `orders.estimate()` 타입 추가

### Book-specs 엔드포인트
- **D-07:** 라이브 API 호출 없음 — `story.ts`의 `BOOK_SPECS` 상수를 그대로 반환하는 `GET /api/sweetbook/book-specs` 로컬 엔드포인트 추가
- **D-08:** 응답 형태: `{ specs: [{ uid, name, minPages, maxPages }] }` 배열
- **D-09:** 타입 검증 완료 — 기존 3개 BookSpecUid(`SQUAREBOOK_HC`, `PHOTOBOOK_A4_SC`, `PHOTOBOOK_A5_SC`)가 현재 Sweetbook 샌드박스에서 실제 동작 확인됨 (Phase 3 완료 시 검증)

### SDK 타입 보완
- **D-10:** `sweetbook.d.ts`에 추가할 타입:
  - `orders.estimate(params)` — `{ items, shipping }` 입력, `{ creditSufficient, totalAmount, ... }` 반환
  - (선택) `credits.get()` — 현재 잔액 반환

</decisions>

<specifics>
## Specific Ideas

- API 문서 확인 결과: 402 에러 응답에 "Required: 12500, Available: 5000" 형태의 구체적 수치가 포함됨 → 에러 메시지에 그대로 노출 가능
- estimate endpoint가 `creditSufficient` 필드를 명시적으로 반환 → boolean 체크로 단순하게 구현 가능
- Webhook(Phase 10)용 HMAC-SHA256 시그니처 헤더 `X-Webhook-Signature` 확인됨 — 이번 페이즈 범위 밖

</specifics>

<canonical_refs>
## Canonical References

### Credits API
- `backend/src/types/sweetbook.d.ts` — 기존 SDK 타입 선언 파일 (여기에 estimate + credits.get 추가)
- `backend/src/routes/sweetbook.ts` — 기존 주문 라우트 (estimate 단계 삽입 위치)

### Book Specs
- `backend/src/types/story.ts` — `BOOK_SPECS` 상수 및 `BookSpecUid` 타입 정의

### API 문서 (외부)
- `https://api.sweetbook.com/docs/guides/orders/` — POST /orders/estimate 요청/응답 스펙, creditSufficient 필드, 402 에러 형태

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handleSweetbookError(err, res)` in `sweetbook.ts:199` — 기존 에러 핸들러, 402 케이스 추가하면 됨
- `sweetbookClient` lazy proxy in `sweebookClient.ts` — estimate 호출에 동일하게 사용
- `extractOrderResponse()` in `sweetbook.ts:184` — 유사한 패턴으로 estimate 응답 파싱 함수 작성 가능

### Established Patterns
- SDK 미지원 메서드는 `fetch()` 직접 호출로 구현 (Phase 3에서 `/templates` API를 `fetch()`로 호출한 선례 — `sweebookClient.ts:36`)
- 에러는 모두 `handleSweetbookError`로 위임

### Integration Points
- estimate 단계는 `createSweetbookBook()` 이전, 또는 `POST /sweetbook/orders` 라우트 핸들러 시작 부분에 삽입
- `GET /api/sweetbook/book-specs`는 `sweetbook.ts` 라우터에 추가 (기존 router 파일 확장)

</code_context>

<deferred>
## Deferred Ideas

- `GET /credits` 직접 호출로 UI에 잔액 표시 — Phase 8 이후 필요 시
- Webhook 설정 (`PUT /webhooks/config`, HMAC 검증) — Phase 10 범위
- `POST /orders/{orderUid}/cancel` 취소 API — Phase 10 또는 별도 phase

</deferred>

---

*Phase: 07-credits-api-dev-environment*
*Context gathered: 2026-04-04*
