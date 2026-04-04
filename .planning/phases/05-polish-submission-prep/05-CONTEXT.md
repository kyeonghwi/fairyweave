# Phase 5: Polish + Submission Prep — Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

심사자가 README만 보고 실행할 수 있는 상태로 마무리. `.env.example` 완성, README.md 작성, 전체 플로우 수동 테스트, GitHub Public 업로드, 구글폼 서술형 4문항 작성 + URL 제출.

**Deliverables:**
- `.env.example` (루트) — 모든 환경변수 키 목록 (값 비움)
- `.gitignore` — `.env` 이미 포함 확인
- `README.md` — 서비스 소개, 실행 방법, API 표, AI 도구 표, 설계 의도
- 더미 데이터 경로 수동 테스트 + 샌드박스 실제 주문 테스트
- GitHub Public 저장소 업로드
- 구글폼 서술형 4문항 작성 + URL 제출

**Done when:** 구글폼 제출 완료.

</domain>

<decisions>
## Implementation Decisions

### README 언어 & 구성
- **D-01:** 전체 한국어. 코드 블록/커맨드만 영어
- **D-02:** 스크린샷/데모 GIF 없음. 텍스트만으로 구성
- **D-03:** 섹션 구성 (ROADMAP 명세 기반):
  1. 서비스 소개 (한 문장 + 타겟 + 주요 기능)
  2. 실행 방법 (복사-붙여넣기 가능한 커맨드)
  3. 사용한 Sweetbook API 엔드포인트 표
  4. AI 도구 활용 내역 표
  5. 설계 의도

### README 설계 의도 (DEV-05)
- **D-04:** 3~5줄 간결 요약. LTV > CAC 아비트리지 + Idempotency-Key 설계 근거를 핵심만 서술
- 비즈니스 모델 상세 분석이나 경쟁사 비교는 불필요

### .env.example
- **D-05:** 루트에 `.env.example` 생성. 모든 환경변수 키 포함:
  - `GEMINI_API_KEY=`
  - `SWEETBOOK_API_KEY=`
  - `SWEETBOOK_ENV=sandbox`
  - `SWEETBOOK_COVER_TEMPLATE_UID=`
  - `SWEETBOOK_CONTENT_TEMPLATE_UID=`
- `backend/.env.example`도 동일하게 업데이트 (현재 GEMINI_API_KEY만 있음)

### 구글폼 서술형 답변
- **D-06:** 톤: 기술적 + 실용적. "이런 문제를 만났고 이렇게 해결했다" 스타일
- **D-07:** 분량: 문항당 3~5줄 간결하게
- **D-08:** 최종 작성은 모든 기능 추가 완료 후. Phase 5 실행 시점에 `submission-log.md` 기반으로 완성
- **D-09:** 문항 2 (API 느낀 점) 포인트:
  - SDK DX 평가 (TypeScript 타입 부재, 메서드 시그니처 추측 필요)
  - 5-step book creation 복잡도 (create → upload → cover → contents → finalize)
  - 샌드박스 경험 (creationType: TEST, 충전금)
  - 개선 제안 (건설적 피드백)

### 수동 테스트
- **D-10:** 더미 데이터 경로만 수동 테스트 (AI 생성은 rate limit + 대기시간 이슈로 생략)
- **D-11:** 샌드박스 실제 주문 테스트 실행 — creationType: TEST로 orderUid 반환까지 확인
- **D-12:** 테스트 결과는 `submission-log.md`에 체크리스트로 기록

### Claude's Discretion
- README 내부 표 포맷팅
- .env.example 주석 스타일
- 테스트 체크리스트 세부 항목
- 구글폼 답변 최종 문구 (톤/분량 가이드 내에서)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 5 — deliverables, done-when criteria
- `.planning/REQUIREMENTS.md` §Developer Experience (DEV-01~05)

### Existing submission materials
- `docs/submission-log.md` — 구글폼 초안, API 사용 내역, AI 도구 내역, 트러블슈팅 기록 (Phase 5에서 최종 정리)

### Environment variables (from prior phases)
- `.planning/phases/01-project-setup-gemini-api-spike/01-CONTEXT.md` — GEMINI_API_KEY
- `.planning/phases/03-sweetbook-api-integration/03-CONTEXT.md` — SWEETBOOK_API_KEY, SWEETBOOK_ENV, SWEETBOOK_COVER_TEMPLATE_UID, SWEETBOOK_CONTENT_TEMPLATE_UID

### Existing files to update
- `.gitignore` (root) — already includes `.env` patterns ✓
- `backend/.env.example` — currently only has `GEMINI_API_KEY=`, needs Sweetbook keys

</canonical_refs>

<specifics>
## Specific Ideas

- README 실행 방법은 "복사-붙여넣기 3줄이면 실행 가능" 수준으로 단순하게
- `npm install` → `.env` 설정 → `npm run dev` 이 세 단계로 끝나야 함
- 구글폼 답변에서 Phase 3의 Sweetbook SDK 트러블슈팅 (Lazy Proxy, File vs Blob, blank page padding) 경험이 문항 4에 좋은 소재
- submission-log.md의 기존 트러블슈팅 기록 8건이 문항 4 작성의 핵심 소스

</specifics>

<deferred>
## Deferred Ideas

None — Phase 5가 마지막 페이즈. 이후 추가 기능은 v2 scope.

</deferred>

---

*Phase: 05-polish-submission-prep*
*Context gathered: 2026-04-02*
