# Phase 8: Bilingual Book - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

책 생성 폼에 언어 옵션(한국어/영어/이중언어)을 추가하고, 선택된 언어에 맞게 스토리를 생성한다.
단어장(Vocabulary 페이지)은 범위에서 제외한다 — 동화책 감성을 방해하므로.

</domain>

<decisions>
## Implementation Decisions

### 언어 선택 UI
- **D-01:** 폼 내 위치: 판형 선택(bookSpecUid) 바로 아래
- **D-02:** 위젯: ThemeChip 스타일 3버튼 — [🇰🇷 한국어] [🇺🇸 영어] [🌏 이중언어]
- **D-03:** 기본값: 한국어 (기존 동작과 동일, breaking change 없음)

### 언어 모드 동작
- **D-04:** 한국어 모드 — 기존과 완전히 동일. 코드 변경 없음, 분기 없음
- **D-05:** 영어 모드 — 스토리 텍스트 전체를 영어로 생성. Gemini 프롬프트에 `language: 'english'` 조건 추가
- **D-06:** 이중언어 모드 — 각 페이지에 영어 텍스트 + 한국어 텍스트 모두 생성. Gemini가 두 언어를 동시에 반환

### 이중언어 페이지 레이아웃 (이중언어 모드 전용)
- **D-07:** 비율: 영어 50% 상단 / 한국어 50% 하단
- **D-08:** 구분: 얇은 수평선 (`border-t`)
- **D-09:** 영어 폰트: 시스템 sans-serif (추가 폰트 로드 없음)
- **D-10:** 한국어 폰트: 기존 `font-jua` 유지
- **D-11:** 언어 레이블 없음 — 위치만으로 구분

### 단어장 (Vocabulary Page)
- **D-12:** 제거 — 동화책 감성과 충돌, 구현하지 않음

### Claude's Discretion
- 이중언어 모드에서 Gemini 프롬프트 구조 (한 번 호출로 두 언어 동시 반환 vs 두 번 호출)
- `StoryPage` 타입 확장 방식 (`textEn?: string` 추가 or 별도 타입)
- 영어/이중언어 모드에서 책 제목 언어 처리

</decisions>

<specifics>
## Specific Ideas

- 이중언어 모드가 "아이 이름으로 만드는 영어 학습 동화책" 스토리를 만들어줌 — 채용 과제 차별화 포인트
- 영어 모드는 해외 거주 한국인 부모, 이중언어 모드는 영어 교육 관심 부모 타겟

</specifics>

<canonical_refs>
## Canonical References

### 스토리 생성 (수정 대상)
- `backend/src/services/storyGenerator.ts` — 언어 분기 추가 위치. 현재 프롬프트는 한국어 고정
- `backend/src/types/story.ts` — `GenerateStoryRequest`에 `language` 필드 추가, `StoryPage`에 `textEn?` 추가 필요

### 프론트엔드 폼 (수정 대상)
- `frontend/src/app/create/page.tsx` — 언어 선택 UI 추가 위치 (판형 선택 바로 아래 `bookSpecUid` 섹션 다음)
- `frontend/src/components/ThemeChip.tsx` — 언어 선택 버튼에 재사용 가능한 칩 컴포넌트

### 책 페이지 렌더링 (수정 대상)
- `frontend/src/components/BookPage.tsx` — 이중언어 모드 text 페이지 레이아웃 추가. 현재 `type: 'text'`에 분기 추가 또는 새 타입
- `frontend/src/components/BookViewer.tsx` — `BookPage`에 언어 모드 prop 전달 필요 여부 확인

### 기존 패턴 참조
- `.planning/phases/04-frontend-ui-dummy-data/04-CONTEXT.md` §D-17 — ThemeChip 패턴 결정 이력
- `.planning/phases/02-ai-generation-pipeline/02-01-PLAN.md` — 기존 Gemini 프롬프트 구조

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ThemeChip` (`frontend/src/components/ThemeChip.tsx`): 언어 선택 버튼에 그대로 재사용 가능
- `generateStory()` in `storyGenerator.ts:22`: `language` 파라미터 추가 → 프롬프트 분기 지점
- `STYLE_SEED` + imagePrompt 주입 패턴: 언어와 무관, 변경 불필요

### Established Patterns
- `GenerateStoryRequest` 타입 확장 패턴: `bookSpecUid?`, `pageCount?`, `title?` 등 optional 필드로 추가 (Phase 2~4 선례)
- 프롬프트 내 JSON 응답 강제: `responseMimeType: 'application/json'` + 마크다운 펜스 제거 로직 (storyGenerator.ts:66)

### Integration Points
- `StoryPage.text` 현재 타입: `string` (한국어 고정) → 이중언어 모드 시 `textEn?: string` 추가 필요
- `frontend/src/app/create/page.tsx:131`: `fetch('/api/generate-book', { body: JSON.stringify({...}) })` — `language` 필드 추가 지점
- `BookPage.tsx:type === 'text'` 분기: 이중언어 레이아웃은 여기에 조건 추가

</code_context>

<deferred>
## Deferred Ideas

- Vocabulary/단어장 페이지 — 의도적으로 제외 (동화책 감성과 충돌)
- 영어 모드에서 아이 이름 영문 표기 자동 변환 — 별도 phase 필요 시
- 언어별 TTS(음성 읽기) — Phase 9 이후 고려

</deferred>

---

*Phase: 08-bilingual-book*
*Context gathered: 2026-04-04*
