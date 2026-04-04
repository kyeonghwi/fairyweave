<!-- /autoplan restore point: /c/Users/khp.PKH/.gstack/projects/kyeonghwi-fairyweave/main-autoplan-restore-20260404-140640.md -->
# polish-submission-prep Planning Document

> **Summary**: 제출 전 UI 폴리시, submission-log 완성, 에러 핸들링 보강
>
> **Project**: FairyWeave
> **Version**: 1.0.0
> **Author**: Claude Code
> **Date**: 2026-04-02
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Phase 4까지 핵심 기능은 완성되었으나, submission-log의 설계 의도/API 소감 섹션이 미작성이고, 에러 상태 UX와 프론트-백엔드 연결 안정성이 검증되지 않았음 |
| **Solution** | submission-log 미완성 섹션 작성 + 프론트엔드 에러/로딩 UX 보강 + AI 생성 플로우 end-to-end 연결 점검 |
| **Function/UX Effect** | 사용자가 AI 생성 실패 시 명확한 에러 메시지를 받고, 제출 문서가 심사 기준에 맞게 완성됨 |
| **Core Value** | 심사위원이 FairyWeave의 설계 판단과 비즈니스 가능성을 명확히 파악할 수 있는 제출물 완성 |

---

## 1. Overview

### 1.1 Purpose

Phase 1~4 구현이 완료된 FairyWeave를 제출 가능한 수준으로 마무리한다. submission-log 미작성 섹션을 채우고, AI 생성 → 주문 전체 플로우의 에러 핸들링을 점검한다.

### 1.2 Background

- Phase 1: 모노레포 + Gemini API 연동
- Phase 2: AI 파이프라인 (스토리 생성 + 이미지 생성)
- Phase 3: SweetBook SDK 연동 (책 생성 + 주문)
- Phase 4: 프론트엔드 UI + 더미 데이터

submission-log.md의 "설계 의도", "API 소감", "과제 수행 과정" 섹션이 미완성 상태다.

### 1.3 Related Documents

- `docs/submission-log.md` — 제출 로그 (핵심 산출물)
- `docs/04-report/frontend-ui-dummy-data.report.md` — Phase 4 완료 보고서

---

## 2. Scope

### 2.1 In Scope

- [ ] submission-log.md 미완성 섹션 작성 (설계 의도, API 소감, 과제 수행 과정 보완)
- [ ] AI 생성 플로우 (/create → generate-book → book preview) 프론트-백 연결 점검
- [ ] 에러 상태 UX 보강 (API 실패, 타임아웃, 네트워크 에러)
- [ ] 코드 정리 (미사용 import, console.log 제거)

### 2.2 Out of Scope

- 새로운 기능 추가
- 디자인 시스템 변경
- 테스트 코드 작성
- CI/CD 파이프라인

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | submission-log "설계 의도" 3개 섹션 완성 (서비스 선택 이유, 비즈니스 가능성, 추가 기능) | High | Pending |
| FR-02 | submission-log "문항 2: API 소감" 작성 | High | Pending |
| FR-03 | submission-log "문항 1: 과제 수행 과정" Phase 2~4 내용 보완 | High | Pending |
| FR-04 | /create 페이지에서 AI 생성 API 호출 연결 확인 | High | Pending |
| FR-05 | /book/[id] 페이지에서 AI 생성 책 프리뷰 + 주문 플로우 확인 | High | Pending |
| FR-06 | API 실패 시 사용자 친화적 에러 메시지 표시 | Medium | Pending |
| FR-07 | 미사용 코드, console.log 정리 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 완성도 | submission-log 모든 섹션 작성 완료 | 수동 체크 |
| 안정성 | AI 생성 실패 시 앱 크래시 없음 | 수동 테스트 |
| 가독성 | 심사위원이 5분 내 핵심 판단 파악 가능 | 문서 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] submission-log.md 빈 섹션 0개
- [ ] /create → AI 생성 → /book/[id] 전체 플로우 동작 확인
- [ ] 에러 발생 시 ErrorBanner 컴포넌트로 사용자에게 안내
- [ ] 불필요한 console.log 제거

### 4.2 Quality Criteria

- [ ] submission-log 각 문항이 구체적 근거를 포함
- [ ] Build 성공 (프론트엔드 + 백엔드)
- [ ] 런타임 에러 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemini API quota 소진으로 AI 생성 테스트 불가 | High | Medium | 더미 데이터 플로우가 이미 동작하므로 AI 실패 시에도 데모 가능 |
| SweetBook 샌드박스 API 다운 | Medium | Low | 주문 플로우는 Phase 3에서 검증 완료, 에러 핸들링만 보강 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend | **V** |
| **Enterprise** | Strict layer separation, DI | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 16 | Next.js 16 | 이미 구축 완료 |
| Backend | Express + TypeScript | Express + TS | 이미 구축 완료 |
| Styling | Tailwind v4 | Tailwind v4 | 이미 구축 완료 |
| API Integration | SweetBook SDK | bookprintapi-nodejs-sdk | Phase 3에서 연동 완료 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

기존 구조 유지 (변경 없음):
frontend/ — Next.js 16 + Tailwind v4
backend/  — Express + TypeScript
docs/     — 제출 문서
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [ ] `CONVENTIONS.md` exists at project root
- [ ] ESLint configuration
- [ ] Prettier configuration
- [x] TypeScript configuration (`tsconfig.json`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | exists (Korean UI, English code) | 유지 | Low |
| **Folder structure** | exists (monorepo) | 유지 | Low |
| **Error handling** | partial | ErrorBanner 패턴 통일 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `GEMINI_API_KEY` | Gemini API 호출 | Server | 이미 존재 |
| `SWEETBOOK_API_KEY` | SweetBook SDK | Server | 이미 존재 |
| `SWEETBOOK_TEMPLATE_UID` | 템플릿 ID | Server | 이미 존재 |

---

## 8. Next Steps

1. [ ] Write design document (`polish-submission-prep.design.md`)
2. [ ] submission-log 미완성 섹션 작성
3. [ ] AI 생성 플로우 연결 점검 + 에러 핸들링
4. [ ] 코드 정리 + 최종 빌드 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-02 | Initial draft | Claude Code |

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Mode: SELECTIVE EXPANSION | Mechanical | P3 | Polish phase, no new features | EXPANSION |
| 2 | CEO | Flag 문항 1 gap as Critical | Mechanical | P1 | Judge-visible submission artifact | Ignore |
| 3 | CEO | Defer TODOS.md items | Mechanical | P6 | Post-deadline, not submission blockers | Bundle in PR |
| 4 | CEO | Include e2e smoke test | Mechanical | P1 | Phases 6-8 added code, verify no regression | Skip |
| 5 | CEO | Keep bilingual default=korean | Mechanical | P5 | language ?? 'korean' is existing safe default | Change default |
| 6 | Eng | Remove console.log breadcrumbs only | Mechanical | P4 | Keep error/warn (observability), remove log (noise) | Remove all |
| 7 | Eng | Add progressTracker error state | Mechanical | P1 | Silent 404 is worse than visible error | Defer |
| 8 | Eng | Defer sweebookClient cast fix | Mechanical | P5 | Works today; changing it risks regression | Fix now |
| 9 | Eng | Defer test automation | Mechanical | P6 | Manual smoke test faster for 4-day deadline | Write tests |
| 10 | Eng | Verify language wiring in /create form | Mechanical | P1 | Phase 8 depends on correct POST body | Skip verify |


## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open | 2 critical findings (문항 1 gap, console.log) — approved to fix |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | N/A (codex unavailable) | — |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | issues_open → fix scoped | 9 findings (1 critical progressTracker, 2 high, 3 medium) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | Skipped (no UI scope) | — |
| Autoplan Voices (CEO) | autoplan | Dual-voice consensus | 1 | subagent-only | 5 findings |
| Autoplan Voices (Eng) | autoplan | Dual-voice consensus | 1 | subagent-only | 9 findings |

**VERDICT:** APPROVED — 5 tasks scoped. Critical: update 문항 1 (phases 6-8), add progressTracker error state, clean console.log. Deadline: Apr 8.

