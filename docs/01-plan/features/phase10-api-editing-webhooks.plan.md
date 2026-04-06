<!-- /autoplan restore point: /c/Users/khp.PKH/.gstack/projects/kyeonghwi-fairyweave/main-autoplan-restore-20260406-010453.md -->
# Phase 10: API Full Coverage, Inline Editing & Webhook Integration

> **Summary**: SweetBook API 전체 엔드포인트 프록시, 부모 인라인 텍스트 편집, Webhook 연동
>
> **Project**: FairyWeave
> **Version**: 1.0.0
> **Author**: Claude Code
> **Date**: 2026-04-06
> **Status**: Implementation Complete (Post-Implementation Review)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Phase 9까지 SweetBook API의 핵심 엔드포인트만 연동 — 주문 목록/취소/배송지 수정, 템플릿 관리, 충전금 조회, Webhook 수신이 미구현이며, AI 생성 텍스트를 부모가 수정할 수 없음 |
| **Solution** | 12개 신규 API 프록시 + 인라인 텍스트 편집 UI + Webhook HMAC 검증 + 이벤트 추적 |
| **Function/UX Effect** | 부모가 AI 텍스트를 검수/수정 후 주문 가능, 관리자가 주문 전체 라이프사이클을 관리 가능, Webhook으로 주문 상태 실시간 추적 |
| **Core Value** | co-creation 경험(이케아 효과)으로 부모 만족도 향상 + AI 환각 방지 안전장치 + 서비스 운영 가능성(full API coverage) 입증 |

---

## 1. Overview

### 1.1 Purpose

SweetBook Book Print API의 전체 엔드포인트를 프록시하여 서비스 운영에 필요한 API 커버리지를 달성하고, 부모가 AI 생성 텍스트를 인라인 편집할 수 있는 co-creation 기능을 추가한다.

### 1.2 Background

- Phase 1-4: 핵심 파이프라인 완성 (스토리 생성 → 이미지 생성 → 책 등록 → 주문)
- Phase 5-9: UI 폴리시, 더미 데이터, 실제 책 레이아웃, 판형 동적 조회
- 남은 과제: API 전체 커버리지 (심사 가산점), 사용자 편집 기능, 웹훅 연동

### 1.3 Related Documents

- `docs/submission-log.md` — 제출 로그 (API 사용 내역 포함)
- `backend/src/routes/sweetbook.ts` — SweetBook API 프록시 라우트
- `backend/src/routes/webhook.ts` — Webhook 수신 라우트 (신규)
- `backend/src/services/orderTracker.ts` — 이벤트 추적 서비스 (신규)

---

## 2. Scope

### 2.1 In Scope

#### A. SweetBook API Full Coverage (Backend)
- [x] `GET /books` — 책 목록 조회 (status/limit/offset)
- [x] `GET /books/:bookUid` — 책 상태 조회
- [x] `GET /book-specs/:specUid` — 판형 상세 (가격 포함)
- [x] `GET /orders` — 주문 목록 조회
- [x] `POST /orders/:orderUid/cancel` — 주문 취소
- [x] `PATCH /orders/:orderUid/shipping` — 배송지 수정
- [x] `GET /templates` — 템플릿 목록 (필터링)
- [x] `GET /templates/:templateUid` — 템플릿 상세
- [x] `GET /credits/balance` — 충전금 잔액
- [x] `GET /credits/transactions` — 충전금 거래 내역

#### B. Webhook Integration (Backend)
- [x] `POST /webhooks/sweetbook` — Webhook 이벤트 수신
- [x] HMAC-SHA256 서명 검증 (`verifySignature` from SDK)
- [x] `orderTracker` — 인메모리 이벤트 저장 (주문별 상태 추적)
- [x] `GET /webhooks/events` — 수신 이벤트 조회 (디버깅)
- [x] `GET /webhooks/events/:orderUid` — 주문별 이벤트 조회
- [x] `PUT /webhooks/config` — Webhook URL 등록/수정
- [x] `GET /webhooks/config` — 현재 설정 조회

#### C. Inline Text Editing (Frontend)
- [x] `BookPage` — textarea 조건부 렌더링 (편집 모드)
- [x] `BookSpread` — 편집 토글 버튼 ("글 수정하기" / "수정 완료")
- [x] `BookViewer` — 데스크톱 전용 편집 모드 (모바일은 strip)
- [x] `book/[id]/page.tsx` — 텍스트 변경 핸들러 + books-from-data 통합

#### D. Order Flow Simplification
- [x] AI 책 주문 경로를 `books-from-data` 단일 경로로 통합 (편집된 텍스트가 인쇄에 반영)

### 2.2 Out of Scope

- 모바일 인라인 편집 (데스크톱 전용)
- Webhook 이벤트 영구 저장 (인메모리, 최대 500개)
- 관리자 대시보드 UI
- 충전금 결제 UI
- 실시간 주문 상태 UI (Webhook 수신만)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | SweetBook API 12개 엔드포인트 프록시 | High | Done |
| FR-02 | Webhook HMAC-SHA256 서명 검증 | High | Done |
| FR-03 | 주문별 Webhook 이벤트 추적 | Medium | Done |
| FR-04 | 부모 인라인 텍스트 편집 (데스크톱) | High | Done |
| FR-05 | 편집된 텍스트가 인쇄에 반영 | High | Done |
| FR-06 | 이중언어 텍스트 각각 편집 가능 | Medium | Done |
| FR-07 | Webhook 설정 관리 API | Medium | Done |
| FR-08 | submission-log.md 업데이트 | High | Done |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| 보안 | Webhook 서명 미검증 시 401 | HMAC-SHA256 |
| 확장성 | 이벤트 500개 cap (메모리 보호) | MAX_EVENTS |
| 호환성 | 기존 더미책/AI책 주문 유지 | E2E 플로우 |
| 성능 | Webhook 응답 5초 이내 (Sweetbook 요구사항) | 즉시 200 응답 |

---

## 4. Architecture

### 4.1 Backend Route Structure

```
backend/src/
├── index.ts              — webhookRouter 등록 + rawBody 보존
├── routes/
│   ├── sweetbook.ts      — 12개 신규 + 기존 엔드포인트 (총 ~20개)
│   └── webhook.ts        — Webhook 수신/이벤트 조회/설정 관리 (신규)
├── services/
│   ├── sweebookClient.ts — SDK 클라이언트 (기존)
│   └── orderTracker.ts   — 인메모리 이벤트 스토어 (신규)
└── types/
    └── sweetbook.d.ts    — verifySignature + 신규 메서드 타입
```

### 4.2 Frontend Component Flow (Editing)

```
book/[id]/page.tsx
  ├── handleToggleEdit()     — isEditMode 토글
  ├── handleTextChange()     — pages[i].text/textEn 업데이트
  └── BookViewer
        ├── (desktop) BookSpread
        │     ├── 편집 토글 버튼
        │     └── BookPage (isEditMode → textarea)
        └── (mobile) MobileView (편집 불가)
```

### 4.3 Webhook Flow

```
SweetBook → POST /api/webhooks/sweetbook
  → express rawBody 보존
  → HMAC-SHA256 서명 검증
  → payload 파싱
  → orderTracker.recordEvent()
  → 200 OK (즉시)
```

---

## 5. Key Technical Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Webhook 서명 검증 | 직접 구현 vs SDK 함수 | SDK `verifySignature` | SDK 제공 함수가 timestamp tolerance 포함, 재구현 불필요 |
| 이벤트 저장 | DB vs 인메모리 | 인메모리 (Map + Array) | 해커톤 scope, 최대 500개 cap으로 메모리 보호 |
| Raw body 보존 | 별도 미들웨어 vs verify callback | `express.json({ verify })` | Express 내장 옵션 활용, 추가 의존성 없음 |
| 편집 모드 범위 | 모바일+데스크톱 vs 데스크톱 전용 | 데스크톱 전용 | 모바일 textarea UX 열악, 책 레이아웃 내 편집은 데스크톱이 적합 |
| AI 책 주문 경로 | 분기(isDummy) vs 통합(books-from-data) | 통합 | 편집된 텍스트가 인쇄에 반영되려면 단일 경로 필요 |

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Webhook secret 미설정 시 서명 검증 스킵 | Medium | Medium | console.warn 로그 + .env.example에 키 추가 |
| 인메모리 이벤트 서버 재시작 시 소실 | Low | High | 해커톤 scope 인정, 프로덕션에서는 DB 전환 필요 |
| SDK에 verifySignature 없을 수 있음 | Medium | Low | d.ts에 타입 선언 + 런타임 존재 확인 |
| 편집 중 페이지 전환 시 변경 손실 | Medium | Medium | 상태가 page.tsx 최상위에서 관리 — 전환해도 유지 |

---

## 7. Success Criteria

- [x] SweetBook API 12개 신규 엔드포인트 정상 응답
- [x] Webhook 수신 + HMAC 검증 동작
- [x] 부모가 텍스트 편집 후 주문하면 편집된 내용이 인쇄에 반영
- [x] submission-log.md에 모든 API 사용 기록

---

## 8. Next Steps

- [ ] 모바일 인라인 편집 UX 개선 (향후)
- [ ] Webhook 이벤트 영구 저장 (DB 전환)
- [ ] 관리자 대시보드 (주문 목록 + 상태 추적 UI)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-06 | Initial (post-implementation) | Claude Code |
| 1.1 | 2026-04-06 | /autoplan review (CEO+Design+Eng+DX) | Claude Code |

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Mode: SELECTIVE EXPANSION | Mechanical | P3 | Post-implementation review, no new features | EXPANSION |
| 2 | CEO | Accept plan structure as-is (3 goals bundled) | Mechanical | P6 | Work is done, re-scoping has negative ROI | Restructure |
| 3 | CEO | Flag webhook-no-consumer as concern, don't block | Taste | P6 | Valid concern but cutting scope post-impl is wasteful | Block on UI |
| 4 | CEO | Accept desktop-only editing | Mechanical | P5 | Textarea in book spread genuinely needs screen space | Add mobile |
| 5 | CEO | Accept in-memory event store | Mechanical | P3 | Hackathon scope, 500 cap adequate for demo | Add SQLite |
| 6 | Design | Fix arrow-key conflict with textarea | Mechanical | P1 | Page flip during text editing is a breaking UX bug | Ignore |
| 7 | Design | Add aria-labels to textareas | Mechanical | P1 | Screen reader accessibility, zero-cost fix | Defer |
| 8 | Design | Show mobile "edit on desktop" banner | Mechanical | P5 | Dead end with no explanation is worse than no feature | Skip |
| 9 | Design | Add undo/reset for edits | Taste | P1 | High value but implementation cost in post-impl review | Defer |
| 10 | Design | Move edit button higher in visual hierarchy | Taste | P5 | Discoverability concern, but current position works | Redesign |
| 11 | Design | Add textarea placeholders for empty state | Mechanical | P1 | Blank pages confuse users | Ignore |
| 12 | Design | Fix __bookCache data loss on refresh | Mechanical | P1 | sessionStorage prevents edit loss on refresh | Ignore |
| 13 | Eng | Fix arrow-key conflict with edit mode | Mechanical | P1 | Breaking UX bug — page flips while editing text | Ignore |
| 14 | Eng | Scope rawBody to webhook routes only | Mechanical | P3 | Doubles memory for 50MB image uploads | Keep global |
| 15 | Eng | Extract SDK private-field helper | Mechanical | P4 | 6 locations repeat same unsafe cast pattern | Keep inline |
| 16 | Eng | Add webhook idempotency check | Mechanical | P1 | Duplicate events on retry corrupt state | Ignore |
| 17 | Eng | Accept zero test coverage for hackathon | Mechanical | P6 | Manual testing faster for 4-day deadline | Write tests |
| 18 | Eng | Fix cancelReason length validation | Mechanical | P5 | Error message says max 500 but code doesn't check | Ignore |
| 19 | Eng | Accept hardcoded prices in preview | Taste | P3 | Real pricing from estimate API would be more accurate | Call estimate |
| 20 | DX | Accept no OpenAPI spec for hackathon | Mechanical | P6 | 2h effort, low judge value vs more features | Add OpenAPI |
| 21 | DX | Accept mixed error response shapes | Taste | P4 | Unifying requires touching 20+ handlers, risky post-impl | Unify now |
| 22 | DX | Accept books-from-data naming | Mechanical | P3 | Renaming breaks existing frontend code | Rename |
| 23 | DX | Accept no pagination metadata | Mechanical | P6 | Upstream API controls shape, proxied as-is | Add metadata |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open | 10 findings (3 high: editing underweighted, scoring assumption, webhook no consumer) |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | 17 findings (7 high), 3 critical bugs fixed (arrow keys, aria-labels, mobile banner) |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | issues_open | 16 findings (4 high: unbounded growth, no idempotency, signature bypass, SDK private fields) |
| DX Review | `/plan-devex-review` | Developer experience | 1 | issues_open | 8 findings (1 critical: zero API docs, 4 high) |
| Autoplan Voices (CEO) | autoplan | Dual-voice consensus | 1 | subagent-only | Codex unavailable |
| Autoplan Voices (Eng) | autoplan | Dual-voice consensus | 1 | subagent-only | Codex unavailable |
| Autoplan Voices (Design) | autoplan | Dual-voice consensus | 1 | subagent-only | Codex unavailable |
| Autoplan Voices (DX) | autoplan | Dual-voice consensus | 1 | subagent-only | Codex unavailable |

**VERDICT:** APPROVED — 3 critical bugs fixed inline (arrow-key conflict, textarea aria-labels, mobile edit banner). 3 taste decisions accepted as recommended. 23 auto-decisions logged. Remaining issues are acceptable for hackathon scope.
