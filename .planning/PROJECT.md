# FairyWeave

## What This Is

아이 이름·나이·테마·부모가 원하는 교훈을 입력하면 Gemini API가 16페이지 분량의 동화 텍스트와 삽화를 생성하고, Sweetbook API로 실물 인쇄본 주문까지 연결해주는 초개인화 AI 동화책 플랫폼이다. 스위트북 바이브코딩 풀스택 개발자 채용 과제 제출용으로 2026-04-08 마감이다.

## Core Value

부모가 입력한 아이 정보로 세상에 단 하나뿐인 동화책을 3분 안에 만들어 주문할 수 있어야 한다.

## Requirements

### Validated

- [x] Gemini API로 16페이지 스토리 텍스트 + 이미지 프롬프트 JSON 배열 생성 — Validated in Phase 02: ai-generation-pipeline
- [x] Gemini 이미지 생성 API로 16장 삽화 병렬 생성 — Validated in Phase 02: ai-generation-pipeline

### Active

- [ ] 아이 이름, 나이, 테마, 교훈을 입력하는 생성 폼
- [ ] Gemini API로 16페이지 스토리 텍스트 + 이미지 프롬프트 JSON 배열 생성
- [ ] Gemini 이미지 생성 API로 16장 삽화 병렬 생성
- [ ] Sweetbook POST /books 호출로 책 객체 생성 (bookUid 획득)
- [ ] Sweetbook POST /orders 호출로 주문 전송 (Idempotency-Key 헤더 포함)
- [ ] 생성된 책 페이지별 프리뷰 UI (단순 슬라이드 방식)
- [ ] 배송지 입력 → 주문 완료 화면
- [ ] 더미 데이터 5권 내장 (dummyData.json) — 평가자 즉시 실행용
- [ ] 더미 북 클릭 → Books API + Orders API 즉시 호출 가능
- [ ] .env.example 포함, API Key 환경변수 관리
- [ ] README.md (실행 방법, API 목록, AI 도구 사용 내역, 설계 의도)

### Out of Scope

- PostgreSQL/Prisma — 과제 미요구, SQLite 또는 무상태로 충분
- AWS S3 / Supabase Storage — 샌드박스 데모에서 불필요한 인프라
- Spotify API 연동 — 범위 초과, 7일 내 완성 불가
- 3D Flipbook 뷰어 — 단순 슬라이드로 동일 효과
- Webhook 수신 서버 — 필수 요구사항 아님
- 사용자 인증(로그인/회원가입) — 과제 범위 아님
- 캐릭터 일관성 고도화 — 더미 데이터로 우회, v2로 이동

## Context

- 스위트북 채용 과제: Books API + Orders API 필수 사용
- Gemini API: 텍스트 생성(gemini-2.5-flash) + 이미지 생성(이미지 생성 모델) 단일 공급자로 통일
- DALL-E 3 대신 Gemini 채택 이유: 레퍼런스 이미지 기반 일관성 지원, 단일 API 키로 텍스트+이미지 처리
- Sandbox 환경: 실제 인쇄/배송 없음, 가상 충전금으로 주문 검증
- Node.js SDK: https://github.com/sweet-book/bookprintapi-nodejs-sdk

## Constraints

- **Timeline**: 2026-04-08 23:59 마감 — 7일, 과도한 인프라 추가 불가
- **Tech Stack**: Next.js (프론트) + Node.js/Express (백엔드) + Gemini API + Sweetbook Node.js SDK
- **API Key**: 백엔드 환경변수에서만 관리, GitHub 커밋 금지
- **Repository**: GitHub Public 저장소

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gemini 단일 API (텍스트+이미지) | 공급자 통일로 복잡도 감소, DALL-E 3 대비 레퍼런스 이미지 지원 | — Pending |
| SQLite 또는 무상태 | 7일 내 PostgreSQL 셋업 및 Prisma 마이그레이션 비용 불필요 | — Pending |
| Idempotency-Key 도입 | 더블클릭/네트워크 재시도로 인한 중복 주문 방지 | — Pending |
| 더미 데이터 5권 내장 | 평가자가 AI 생성 대기 없이 즉시 Books/Orders API 검증 가능 | — Pending |

---
*Last updated: 2026-04-01 — Phase 02 complete: AI generation pipeline (story text + 16 parallel images + book storage + unified endpoint)*
