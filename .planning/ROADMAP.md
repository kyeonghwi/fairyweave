# Roadmap: FairyWeave

**Created:** 2026-04-01
**Deadline:** 2026-04-08 23:59 (7 days)
**Goal:** Sweetbook 채용 과제 제출 — Books API + Orders API 연동, 즉시 실행 가능한 풀스택 웹앱

---

## Phase 1 — Project Setup & Gemini API Spike (Day 1: Apr 1)

**Goal:** 프로젝트 골격 구성 + Gemini API 텍스트/이미지 생성 동작 확인

**Deliverables:**
- Next.js + TypeScript 프로젝트 초기화 (App Router)
- Node.js/Express 백엔드 초기화
- Tailwind CSS 설정
- Gemini API 키 환경변수 연동 확인
- `/api/generate` 엔드포인트 — 텍스트 생성 동작 확인 (단순 테스트)
- `/api/generate-image` 엔드포인트 — 이미지 생성 1장 동작 확인

**Requirements covered:** 사전 기반 작업
**Done when:** `npm run dev` 실행 시 Gemini 텍스트+이미지 생성 응답이 콘솔에 찍힌다

**Plans:** 2/2 plans complete
Plans:
- [x] 01-PLAN-1-monorepo-setup.md — Root workspace + Next.js frontend + Express backend scaffold
- [x] 01-PLAN-2-gemini-spike.md — Gemini text and image generation endpoints wired and smoke tested

---

## Phase 2 — AI Generation Pipeline (Day 2: Apr 2)

**Goal:** 16페이지 스토리 + 삽화 자동 생성 파이프라인 완성

**Deliverables:**
- 메타 프롬프트 엔지니어링: GPT 역할 지시문 + JSON 배열 반환 구조
- 16페이지 스토리 텍스트 + 이미지 프롬프트 JSON 생성
- Promise.all()로 16장 이미지 병렬 생성
- 공통 스타일 시드 구문 자동 삽입
- 생성 결과 인메모리 임시 저장 (또는 세션)

**Requirements covered:** AI-01, AI-02, AI-03
**Done when:** 입력값 → 16페이지 스토리 + 이미지 URL 배열이 API 응답으로 반환된다

**Plans:** 2/2 plans complete
Plans:
- [x] 02-01-PLAN.md — Types + meta-prompt + story generation endpoint (POST /api/generate-story)
- [x] 02-02-PLAN.md — Parallel image generation + in-memory store + unified generate-book endpoint

---

## Phase 3 — Sweetbook API Integration (Day 3: Apr 3)

**Goal:** Books API + Orders API 완전 연동

**Deliverables:**
- Sweetbook Node.js SDK 설치 및 클라이언트 초기화
- GET /templates 호출 + 적합한 템플릿 ID 선택 로직
- POST /books 호출 — 16페이지 페이로드 구성 + bookUid 수신
- POST /orders 호출 — Idempotency-Key(UUIDv4) 헤더 포함
- 환경변수 기반 Sandbox/Live Base URL 분기

**Requirements covered:** SB-01, SB-02, SB-03, SB-04, SB-05
**Done when:** Sweetbook 샌드박스에서 주문 접수가 확인되고 orderUid가 반환된다

**Plans:** 2/2 plans complete
Plans:
- [x] 03-01-PLAN.md — SDK install + SweetbookClient singleton + TypeScript declarations + env var validation
- [x] 03-02-PLAN.md — POST /api/sweetbook/books (5-step flow + rollback) + POST /api/sweetbook/orders + index.ts mount

---

## Phase 4 — Frontend UI + Dummy Data (Day 4-5: Apr 4-5)

**Goal:** 사용자가 쓸 수 있는 완전한 UI + 즉시 실행 가능한 더미 데이터

**Deliverables:**
- 생성 폼 컴포넌트 (아이 이름, 나이, 테마, 교훈 입력)
- AI 생성 로딩 상태 (Tailwind animate-pulse 또는 진행 텍스트)
- 책 프리뷰 슬라이드 컴포넌트 (이전/다음 페이지)
- 주문 폼 (배송지 입력) + 주문 완료 화면
- dummyData.json 5권 제작 (AI로 미리 생성한 텍스트 + 이미지)
- 메인 화면 갤러리 섹션 — 더미 북 5권 즉시 로드
- 더미 북 선택 → Books API + Orders API 즉시 호출 플로우

**Requirements covered:** FORM-01~03, UI-01~03, DUM-01~03, AI-04
**Done when:** 더미 북 선택 → 주문 완료까지 전체 플로우가 AI 생성 없이 동작한다

---

## Phase 5 — Polish + Submission Prep (Day 6-7: Apr 6-7)

**Goal:** 심사자가 README만 보고 실행할 수 있는 상태로 마무리

**Deliverables:**
- .env.example 파일 (SWEETBOOK_API_KEY, GEMINI_API_KEY 등 키 목록, 값 비움)
- .gitignore (.env 포함)
- README.md 작성:
  - 서비스 소개 (한 문장 + 타겟 + 주요 기능)
  - 실행 방법 (복사-붙여넣기 가능)
  - Sweetbook API 엔드포인트 표
  - AI 도구 활용 내역 표
  - 설계 의도 (LTV > CAC 아비트리지, Idempotency-Key)
- 전체 플로우 수동 테스트 (더미 데이터 경로 + AI 생성 경로)
- GitHub Public 저장소 업로드
- 구글폼 서술형 4문항 작성 + URL 제출

**Requirements covered:** DEV-01~05
**Done when:** 구글폼 제출 완료

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sweetbook API 스펙이 문서와 다름 | Medium | High | Phase 3 시작 시 실제 API docs 먼저 확인 |
| Gemini 이미지 생성 rate limit | Medium | Medium | 더미 데이터로 우회, 생성 테스트는 최소화 |
| Gemini 이미지 URL 만료 | Low | Low | 샌드박스 데모 범위에서 허용 |
| Phase 4 UI 작업 지연 | Medium | Medium | Phase 3까지 완료하면 Phase 5 일부 병렬 진행 가능 |

---
*Roadmap created: 2026-04-01*
