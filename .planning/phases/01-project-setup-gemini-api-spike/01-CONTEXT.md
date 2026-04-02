# Phase 1: Project Setup & Gemini API Spike — Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Source:** Design document (khp-main-design-20260401-173218.md)

<domain>
## Phase Boundary

Next.js + Express 모노레포 초기화 + Gemini API 텍스트/이미지 생성 동작 확인.

이 페이즈는 인프라 기반 작업이다 — UI 없고, Sweetbook 연동 없음. 개발자가 `npm run dev`를 실행했을 때 Gemini 텍스트 응답과 이미지 생성 응답이 콘솔에 출력되면 완료.

**Deliverables:**
- `frontend/` — Next.js 14+ App Router + TypeScript + Tailwind CSS
- `backend/` — Node.js/Express + TypeScript
- `backend/.env` — GEMINI_API_KEY 연동 확인
- `POST /api/generate` — Gemini 텍스트 생성 테스트 엔드포인트
- `POST /api/generate-image` — Gemini 이미지 생성 1장 테스트 엔드포인트

**Done when:** `npm run dev` (both frontend + backend) 실행 후 `/api/generate`와 `/api/generate-image` 호출 시 Gemini 응답이 콘솔/응답에 출력된다.

</domain>

<decisions>
## Implementation Decisions

### Project Structure
- Monorepo: `frontend/` + `backend/` 디렉토리 (단일 레포)
- Root `package.json`에 `dev` 스크립트: frontend + backend 동시 실행 (concurrently 또는 별도 터미널 안내)
- `.gitignore` 루트 레벨: `.env*` (both dirs)

### Frontend (frontend/)
- Framework: Next.js 14+ (App Router), TypeScript
- Styling: Tailwind CSS
- 이 페이즈에서 UI는 최소 — index page는 placeholder "FairyWeave" 텍스트만 있어도 됨

### Backend (backend/)
- Runtime: Node.js + Express + TypeScript (ts-node-dev 또는 tsx로 dev 실행)
- Port: 3001 (frontend는 3000)
- 구조: `src/index.ts` (Express app), `src/routes/generate.ts` (생성 라우터)

### Gemini API
- SDK: `@google/generative-ai` npm 패키지
- Model for text: `gemini-2.0-flash` (또는 현재 available한 최신 flash)
- Model for image: `gemini-2.0-flash-exp` 우선 시도 → 안 되면 `imagen-3.0-generate-001` 폴백
- API Key: `backend/.env`의 `GEMINI_API_KEY` 환경변수

### API Endpoints (Phase 1 scope — test only)
- `POST /api/generate` — body: `{ prompt: string }` → Gemini 텍스트 응답 반환
- `POST /api/generate-image` — body: `{ prompt: string }` → 이미지 URL 또는 base64 반환
- 이 엔드포인트들은 Phase 2에서 완전한 파이프라인으로 교체됨 (spike 목적)

### Environment Variables
- `backend/.env`: `GEMINI_API_KEY=`
- `backend/.env.example`: `GEMINI_API_KEY=` (값 비움, Phase 5에 루트로 이동 예정)
- `SWEETBOOK_API_KEY`는 Phase 3에서 추가

### Claude's Discretion
- TypeScript strict mode 설정 여부
- Express 미들웨어 선택 (cors, body-parser 등 기본값 사용)
- Gemini 이미지 응답 형식 처리 (base64 vs URL — API 응답에 맞게 처리)
- 에러 핸들링 수준 (Phase 1은 최소, try/catch + console.error 수준)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Design
- `.planning/ROADMAP.md` — Phase 1 goal, deliverables, done-when criteria
- `.planning/REQUIREMENTS.md` — v1 requirements (Phase 1은 req-ID 없음, 사전 기반 작업)

### Architecture Decisions
- Design doc decision: Gemini 단일 공급자 (Google AI Studio) — DALL-E 폴백 없음
- Design doc decision: Stateless (인증 없음)
- Design doc decision: Monorepo (frontend/ + backend/)

No external specs yet — requirements fully captured in decisions above.

</canonical_refs>

<specifics>
## Specific Ideas

- Vertical Slice 접근: Phase 1은 spike만. Full pipeline은 Phase 2.
- Gemini 이미지 생성 실패 시 즉시 Imagen 3 폴백 결정 (Day 2 이전)
- `npm run dev` 한 명령으로 프론트 + 백 동시 실행되면 편리함 (concurrently 패키지)
- Phase 1 완료 확인: `curl -X POST localhost:3001/api/generate -d '{"prompt":"hello"}' -H "Content-Type: application/json"` → Gemini 텍스트 응답

</specifics>

<deferred>
## Deferred Ideas

- Sweetbook API 연동 → Phase 3
- 16페이지 파이프라인 → Phase 2
- 더미 데이터 → Phase 4
- README / .env.example 완성 → Phase 5
- UI 폴리싱 → Phase 4-5

</deferred>

---

*Phase: 01-project-setup-gemini-api-spike*
*Context gathered: 2026-04-01 from design doc*
