# Phase 9: Parent Letter + Photo Dedication Page - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

생성 폼에 아이 사진 업로드 + 부모님 편지 텍스트 입력을 추가한다.
책 첫 페이지에 폴라로이드 프레임 스타일 사진 + 편지를 렌더링한다.
Sweetbook API 페이로드 수정은 범위 밖 — 헌정 페이지는 뷰어 렌더링 전용이다.

</domain>

<decisions>
## Implementation Decisions

### 헌정 페이지 위치
- **D-01:** 책 첫 페이지만 — 마지막 페이지 추가 없음
- **D-02:** BookRecord의 기존 pages 배열 앞에 dedication 페이지를 삽입하지 않음 — 별도 필드(`dedicationPage?`)로 분리하여 렌더링 시 첫 번째로 표시

### 사진 업로드 UX
- **D-03:** 방식: 단순 `<input type="file" accept="image/*">` — 드래그&드랍 없음
- **D-04:** 필수 여부: 선택 사항 — 사진 없이 편지만으로도 헌정 페이지 생성 가능
- **D-05:** 저장: FileReader로 base64 data URI 변환 → `BookRecord.dedicationPhotoUrl?: string`에 저장 (기존 `coverImageUrl` 패턴과 동일)
- **D-06:** 편지도 없고 사진도 없으면 헌정 페이지 자체를 생성하지 않음

### 편지 텍스트 형태
- **D-07:** 단순 `textarea` — 기존 `moral` 필드와 동일한 패턴
- **D-08:** 글자 수 제한: 200자
- **D-09:** placeholder: `"예: 우리 민준이에게, 넌 엄마 아빠의 가장 소중한 보물이야 ♥"`
- **D-10:** 기본값 없음 — 선택 사항

### 폴라로이드 페이지 레이아웃
- **D-11:** 배경: `#faf6f0` (기존 text 페이지와 동일)
- **D-12:** 사진 있을 때: 상단 60% 폴라로이드 프레임(흰 border, 하단 여백 더 크게) + 하단 40% 편지 텍스트 (`font-jua`)
- **D-13:** 사진 없을 때: 편지 텍스트만 중앙 정렬 (기존 text 페이지 스타일)
- **D-14:** 편지 없을 때: 사진만 페이지 중앙 배치
- **D-15:** 새 `type: 'dedication'`을 `BookPage` 컴포넌트에 추가 — 기존 `'image' | 'text' | 'blank'` 타입 확장

### Claude's Discretion
- 폴라로이드 프레임 정확한 border 두께 및 그림자 스타일
- 헌정 페이지를 BookViewer/BookSpread에 주입하는 정확한 방식 (prop vs. pages 배열 prepend)

</decisions>

<specifics>
## Specific Ideas

- 폴라로이드 스타일: 흰 배경 border + 아래쪽 여백이 위쪽보다 2배 큰 클래식 폴라로이드 비율
- 감성 포인트 — 실제 아이 사진이 들어가면 "세상에 단 하나뿐인 책" 차별화

</specifics>

<canonical_refs>
## Canonical References

### 폼 (수정 대상)
- `frontend/src/app/create/page.tsx` — 사진 업로드 input + 편지 textarea 추가 위치 (기존 `moral` 필드 아래 또는 별도 섹션)

### 타입 (수정 대상)
- `backend/src/types/story.ts` — `BookRecord`에 `dedicationPhotoUrl?: string`, `dedicationLetter?: string` 필드 추가

### 렌더링 (수정 대상)
- `frontend/src/components/BookPage.tsx` — `type: 'dedication'` 케이스 추가
- `frontend/src/components/BookViewer.tsx` — 헌정 페이지를 첫 번째로 주입하는 로직
- `frontend/src/components/BookSpread.tsx` — 동일

### 기존 패턴 참조
- `backend/src/routes/generate.ts` — `BookRecord` 생성 시 `coverImageUrl` 저장 패턴 (dedicationPhotoUrl 동일 방식)
- `.planning/phases/08-bilingual-book/08-CONTEXT.md` §D-07~D-11 — 페이지 레이아웃 분기 패턴

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FormField` (`frontend/src/components/ui/FormField.tsx`): 사진 업로드 + 편지 입력 감싸기에 재사용
- `coverImageUrl` base64 저장 패턴 (`backend/src/routes/generate.ts`): `dedicationPhotoUrl` 동일하게 적용
- `BookPage` type 분기 구조 (`frontend/src/components/BookPage.tsx:13`): `'dedication'` 케이스 추가 지점

### Established Patterns
- `BookRecord` optional 필드 확장: `?` 필드로 추가, 기존 호출부 영향 없음 (phases 2~8 선례)
- 파일 → base64 변환: `FileReader.readAsDataURL()` → state 저장 → JSON body에 포함

### Integration Points
- `frontend/src/app/create/page.tsx:138`: `fetch('/api/generate-book', { body: JSON.stringify({...}) })` — `dedicationPhotoUrl`, `dedicationLetter` 추가 지점
- `frontend/src/app/book/[id]/page.tsx`: 헌정 페이지 데이터를 BookViewer에 전달하는 지점
- `BookViewer` props (`frontend/src/components/BookViewer.tsx:6`): 헌정 페이지 prop 추가 필요

</code_context>

<deferred>
## Deferred Ideas

- 마지막 페이지에도 헌정 페이지 추가 — 의도적으로 제외 (복잡도 대비 효과 낮음)
- 드래그&드랍 파일 업로드 — 별도 phase 또는 미구현
- 헌정 페이지를 Sweetbook API 실제 페이지로 포함 (현재는 뷰어 전용) — Phase 10 이후 고려

</deferred>

---

*Phase: 09-parent-letter-photo-dedication*
*Context gathered: 2026-04-04*
