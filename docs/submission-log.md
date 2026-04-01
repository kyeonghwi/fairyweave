# FairyWeave 제출 로그

> Claude Code가 개발 과정에서 자동으로 업데이트합니다. 구글폼 제출 시 참고하세요.

---

## 3. 사용한 Book Print API 엔드포인트

| API | 용도 | 사용 시점 |
|-----|------|----------|
| `POST /books` | 책 객체 생성 (bookUid 획득): books.create → photos.upload × 16 → covers.create → contents.insert × 16 → books.finalize | Phase 3 |
| `POST /orders` | 주문 전송 (Idempotency-Key SDK 자동 삽입, externalRef UUIDv4 포함) | Phase 3 |

---

## 4. AI 도구 사용 내역

| AI 도구 | 활용 내용 | 시점 |
|---------|----------|------|
| Claude Code | Phase 1 — 모노레포 스캐폴딩 (package.json, Next.js 16, Express 백엔드 구조 생성) | 2026-04-01 |
| Claude Code | Phase 1 — Gemini API 스파이크 (`POST /api/generate`, `POST /api/generate-image` 라우트 구현) | 2026-04-01 |
| Claude Code | Phase 1 — 모델 선택: gemini-2.0-flash가 신규 계정에서 404 반환 → gemini-2.5-flash / gemini-2.5-flash-image로 교체 | 2026-04-01 |
| Claude Code | Phase 2 — 스토리 타입 정의 (StoryPage, GenerateStoryRequest, GenerateStoryResponse, BookRecord) 및 storyGenerator 서비스 구현 | 2026-04-01 |
| Claude Code | Phase 2 — POST /api/generate-story 엔드포인트 구현 (메타-프롬프트 엔지니어링, JSON 파싱, 스타일 시드 주입) | 2026-04-01 |
| Claude Code | Phase 2 — imageGenerator 서비스 구현 (Promise.allSettled로 16장 병렬 생성, 개별 실패 시 placeholder 처리) | 2026-04-01 |
| Claude Code | Phase 2 — bookStore 서비스 구현 (in-memory Map 기반 BookRecord 저장/조회) | 2026-04-01 |
| Claude Code | Phase 2 — POST /api/generate-book (전체 파이프라인) 및 GET /api/books/:id 엔드포인트 구현 | 2026-04-01 |
| Claude Code | Phase 3 — bookprintapi-nodejs-sdk 설치, sweetbook.d.ts TypeScript 타입 선언, sweebookClient.ts 싱글턴 서비스 구현 (startup env var validation) | 2026-04-01 |
| Claude Code | Phase 3 — sweetbook.ts 라우트 구현: POST /api/sweetbook/books (5-step 책 생성 + 롤백), POST /api/sweetbook/orders (UUIDv4 externalRef), index.ts에 sweebookRouter 마운트 | 2026-04-01 |
| Gemini 2.5 Flash | 텍스트 스토리 생성 API 호출 검증 | 2026-04-01 |
| Gemini 2.5 Flash Image | 이미지 생성 API 호출 검증 (base64 PNG 반환 확인) | 2026-04-01 |

---

## 5. 설계 의도

### 왜 이 서비스를 선택했는지
> (작성 필요)

### 비즈니스 가능성
> (작성 필요)

### 시간이 더 있었다면 추가했을 기능
> (작성 필요)

---

## 구글폼 문항 초안

### 문항 1: 과제 수행 과정
> Phase 1에서는 Next.js 16 + Express 모노레포를 설정하고 Gemini API 연동을 검증했습니다.
> gemini-2.0-flash 모델이 신규 계정에서 동작하지 않아 gemini-2.5-flash로 교체하는 트러블슈팅이 있었습니다.
> *(개발 진행에 따라 자동 업데이트)*

### 문항 2: API를 써보고 느낀 점
> *(Book Print API 사용 후 자동 추가)*

### 문항 3: 과제에서 내린 가장 중요한 판단
> - Gemini 모델 버전 선택: gemini-2.0-flash → gemini-2.5-flash (신규 계정 404 이슈 해결)
> - 이미지 생성에 gemini-2.5-flash-image 사용 (gemini-2.0-flash-exp 대신)
> *(개발 진행에 따라 자동 추가)*

### 문항 4: AI 도구 사용 중 겪은 실패 또는 문제
> - **문제**: gemini-2.0-flash 모델 호출 시 404 반환 ("no longer available to new users")
>   **해결**: ListModels API로 사용 가능한 모델 목록 조회 후 gemini-2.5-flash로 교체
> - **문제**: gsd-tools가 `01-PLAN-1-*.md` 형식의 플랜 파일을 인식하지 못함
>   **해결**: `01-01-PLAN.md` 형식으로 파일명 변경
> *(개발 진행에 따라 자동 추가)*

---

## 트러블슈팅 기록

| 날짜 | 문제 | 원인 | 해결 |
|------|------|------|------|
| 2026-04-01 | gemini-2.0-flash 404 | 신규 계정에 제공 중단 | gemini-2.5-flash로 교체 |
| 2026-04-01 | gemini-2.0-flash-exp 이미지 생성 안됨 | 모델 미지원 | gemini-2.5-flash-image로 교체 |
| 2026-04-01 | gsd-tools 플랜 파일 미인식 | 파일명 형식 불일치 | `01-01-PLAN.md` 형식으로 변경 |
