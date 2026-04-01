# FairyWeave — Claude Code Instructions

## 제출 로그 자동 업데이트 규칙

**`docs/submission-log.md`를 항상 최신 상태로 유지합니다.**

다음 상황이 발생하면 즉시 해당 파일을 업데이트하세요:

### Book Print API 사용 시
`docs/submission-log.md`의 "3. 사용한 Book Print API 엔드포인트" 표에 추가:
- API 엔드포인트 (예: `POST /books`)
- 용도
- 사용 시점 (Phase 번호)

### AI 도구 활용 시
`docs/submission-log.md`의 "4. AI 도구 사용 내역" 표에 추가:
- 어떤 AI 도구를 어떤 목적으로 사용했는지
- Claude Code가 직접 코드를 생성/수정한 경우 반드시 기록

### 중요한 기술 판단을 내릴 때
`docs/submission-log.md`의 "문항 3: 가장 중요한 판단"에 추가:
- 어떤 선택지가 있었고 왜 이 방향을 골랐는지

### 문제/실패를 겪을 때
`docs/submission-log.md`의 "문항 4: AI 도구 사용 중 겪은 실패" 및 "트러블슈팅 기록"에 추가:
- 문제 현상, 원인, 해결 방법

### Book Print API 사용 후 느낀 점
`docs/submission-log.md`의 "문항 2: API를 써보고 느낀 점"에 추가.

---

## 프로젝트 구조

- `frontend/` — Next.js 16 + Tailwind v4 (포트 3000)
- `backend/` — Express + TypeScript (포트 3001)
- `docs/` — 제출 문서 (submission-log.md)

## 개발 서버

```bash
npm run dev   # 루트에서 실행 — 프론트 + 백엔드 동시 시작
```

## 환경 변수

- `backend/.env` — GEMINI_API_KEY 필요
- 루트 `.env` — SWEETBOOK_API_KEY, GEMINI_API_KEY 마스터 보관

## Gemini 모델

- 텍스트: `gemini-2.5-flash`
- 이미지: `gemini-2.5-flash-image`
- (gemini-2.0-flash는 신규 계정 사용 불가)
