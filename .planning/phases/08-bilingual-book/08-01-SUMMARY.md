---
phase: 08-bilingual-book
plan: "01"
subsystem: backend
tags: [language, bilingual, types, story-generator, routes]
dependency_graph:
  requires: []
  provides: [Language type, StoryPage.textEn, GenerateStoryRequest.language, language-aware prompt branching, route language extraction]
  affects: [backend/src/types/story.ts, backend/src/services/storyGenerator.ts, backend/src/routes/generate.ts]
tech_stack:
  added: []
  patterns: [union type language discrimination, optional field backward compatibility, prompt branching via helper function]
key_files:
  created: []
  modified:
    - backend/src/types/story.ts
    - backend/src/services/storyGenerator.ts
    - backend/src/routes/generate.ts
decisions:
  - Language type added as 'korean' | 'english' | 'bilingual' union; korean mode is unchanged from previous behavior (D-04)
  - StoryPage.textEn is optional so existing Korean-only records stay valid without migration
  - getLanguageInstructions helper keeps prompt branching isolated from the main generateStory function body
  - bilingual mode textEn fallback copies text field when Gemini omits it, preventing null renders
  - Routes default to 'korean' for any missing or invalid language value — no breaking change to existing callers
metrics:
  duration: 3min
  completed: "2026-04-04"
  tasks: 3
  files_changed: 3
---

# Phase 08 Plan 01: Language Type + Prompt Branching Summary

Backend language support wired end-to-end: Language union type added to story types, Gemini prompt branches on korean/english/bilingual mode, and both generate routes extract and validate the language field from request bodies.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add Language type, StoryPage.textEn, GenerateStoryRequest.language to story.ts | f6d4cc8 |
| 2 | Add getLanguageInstructions helper and language-aware prompt branching to storyGenerator | f06a2d8 |
| 3 | Extract and validate language field in both generate routes, pass to generateStory | b41c5b3 |

## Decisions Made

- **Korean mode unchanged:** `language ?? 'korean'` default ensures all existing callers get identical behavior. No prompt text changed for korean mode.
- **Optional fields only:** `textEn?` and `language?` are both optional — BookRecord serialization and in-memory store require no changes.
- **Prompt helper function:** `getLanguageInstructions(language, age)` returns a string injected into the prompt template. This keeps the large prompt template readable and the branching logic testable in isolation.
- **bilingual fallback:** After Gemini JSON parse, a loop fills `page.textEn = page.text` for any page missing `textEn`. This prevents runtime null errors in the viewer layer added in subsequent plans.
- **Route validation:** Both `/api/generate-story` and `/api/generate-book` validate `language` against the `['korean', 'english', 'bilingual']` whitelist and default to `'korean'`. Invalid strings silently downgrade rather than returning 400 — keeps the API forgiving for frontend experiments.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan only adds type/prompt infrastructure. The frontend UI for language selection is out of scope for this plan (handled in 08-02 or later).

## Self-Check: PASSED

- `backend/src/types/story.ts` — modified, confirmed contains `export type Language`
- `backend/src/services/storyGenerator.ts` — modified, confirmed contains `const language: Language = req.language ?? 'korean'`
- `backend/src/routes/generate.ts` — modified, confirmed imports `Language` and passes it through
- Commits f6d4cc8, f06a2d8, b41c5b3 — all exist in git log
- TypeScript compilation: 0 errors after each task
