---
phase: 03-sweetbook-api-integration
plan: 02
subsystem: api
tags: [sweetbook, bookprintapi-nodejs-sdk, express, typescript]

# Dependency graph
requires:
  - phase: 03-01
    provides: sweetbookClient singleton, sweetbook.d.ts TypeScript declarations, bookprintapi-nodejs-sdk installed
  - phase: 02-02
    provides: bookStore with BookRecord (imageUrls base64 data URIs, pages with text), POST /api/generate-book
provides:
  - POST /api/sweetbook/books — 5-step Sweetbook book creation flow returning bookUid (sandbox-verified)
  - POST /api/sweetbook/orders — order creation with UUIDv4 externalRef returning orderUid (sandbox-verified)
  - Rollback via books.delete on steps 2-5 failure
affects:
  - 04-frontend-ui
  - 05-polish-submission

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "5-step Sweetbook book creation: create → upload photos sequentially (as File, not Blob) → create cover → insert content pages → pad to 24-page minimum → finalize"
    - "Rollback on failure: books.delete(bookUid) best-effort, error swallowed"
    - "photos.upload returns fileName reference (not URL) — use photo.fileName ?? photo.url"
    - "bookUid ?? uid pattern for book creation response field variance"
    - "externalRef: randomUUID() per order from node:crypto (no uuid package)"
    - "Lazy Proxy singleton for sweetbookClient — defers env var validation until first use after dotenv.config()"

key-files:
  created:
    - backend/src/routes/sweetbook.ts
  modified:
    - backend/src/services/sweebookClient.ts
    - backend/src/index.ts
    - docs/submission-log.md

key-decisions:
  - "Sequential photo upload (not parallel) — deferred optimization per CONTEXT.md"
  - "creationType: 'TEST' hardcoded — prevents accidental sandbox charge in NORMAL mode"
  - "Rollback delete errors ignored — books.delete is best-effort cleanup, original error propagates to client"
  - "Lazy Proxy singleton for sweetbookClient — fixes dotenv import-order race without changing index.ts startup sequence"
  - "File instead of Blob for photo upload — Sweetbook multipart upload requires filename in Content-Disposition"
  - "Step 4b blank pages (template 2mi1ao0Z4Vxl) to pad 16 content pages to 24-page SQUAREBOOK_HC minimum"

patterns-established:
  - "sweebookRouter export (note spelling: sweebook, not sweetbook) — matches Plan 01 client singleton name"
  - "Error hierarchy: SweetbookApiError → 500, SweetbookValidationError → 400, SweetbookNetworkError → 502"

requirements-completed: [SB-02, SB-03, SB-04, SB-05]

# Metrics
duration: 30min
completed: 2026-04-01
---

# Phase 03 Plan 02: Sweetbook Routes Summary

**Express routes for 5-step Sweetbook book creation (File upload, cover, content pages, 24-page pad, finalize, rollback) and order placement — sandbox-verified with real bookUid and orderUid returned**

## Performance

- **Duration:** ~30 min (including sandbox verification and fix iterations)
- **Started:** 2026-04-01T12:36:20Z
- **Completed:** 2026-04-01T13:10:00Z
- **Tasks:** 3 of 3 (all complete)
- **Files modified:** 4

## Accomplishments

- `POST /api/sweetbook/books`: 5-step flow — books.create, sequential photos.upload × 16 as File objects, covers.create (with dateRange), contents.insert × 16 (photo1/date/title/diaryText fields), 8 blank padding pages, books.finalize — with books.delete rollback on any step 2-5 failure
- `POST /api/sweetbook/orders`: order creation with fresh randomUUID() per request as externalRef, full shipping field validation
- sweebookRouter mounted in index.ts alongside existing generateRouter — zero disruption to existing routes
- Sandbox end-to-end verified: bookUid `bk_4opKAK7XQlWN` and orderUid `or_2XbCIgUU7x0u` returned from live Sweetbook sandbox

## Task Commits

1. **Task 1: Implement sweetbook.ts routes (books + orders)** - `9297a42` (feat)
2. **Task 2: Mount sweebookRouter in index.ts** - `d8dec22` (feat)
3. **Task 3: Sandbox end-to-end verification (fixes)** - `def6966` (fix)

## Files Created/Modified

- `backend/src/routes/sweetbook.ts` — Express router with /sweetbook/books and /sweetbook/orders endpoints, dataUriToFile helper, extractPhotoRef helper, blank-page padding step
- `backend/src/services/sweebookClient.ts` — Changed to lazy Proxy singleton to fix dotenv import-order issue
- `backend/src/index.ts` — Added sweebookRouter import and app.use('/api', sweebookRouter) mount
- `docs/submission-log.md` — Added POST /books and POST /orders API entries, Phase 3 AI tool entry

## Decisions Made

- Sequential photo upload matches deferred decision in CONTEXT.md (parallel optimization deferred to later phase)
- `creationType: 'TEST'` is hardcoded, not from env var — prevents accidental billing in NORMAL mode per Pitfall 4 in RESEARCH.md
- Rollback errors swallowed — original error takes priority for client-side diagnosis
- Lazy Proxy singleton defers `createClient()` call until after `dotenv.config()` in index.ts runs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sweetbookClient env var validation ran before dotenv.config()**
- **Found during:** Task 3 (Sandbox verification)
- **Issue:** `createClient()` called at module load time; `process.env.SWEETBOOK_API_KEY` was undefined because `dotenv.config()` in index.ts hadn't run yet
- **Fix:** Wrapped singleton in Proxy that calls `createClient()` lazily on first property access
- **Files modified:** `backend/src/services/sweebookClient.ts`
- **Verification:** Backend started successfully with no env var errors
- **Committed in:** `def6966`

**2. [Rule 1 - Bug] photos.upload requires File (with filename), not Blob**
- **Found during:** Task 3 (Sandbox verification)
- **Issue:** Sweetbook multipart upload rejected Blob — Content-Disposition header requires a filename
- **Fix:** Changed `dataUriToBlob` → `dataUriToFile`, passing `photo_${i+1}.png` as filename; `new File([buffer], filename, { type })`
- **Files modified:** `backend/src/routes/sweetbook.ts`
- **Verification:** photos.upload accepted files and returned photo references
- **Committed in:** `def6966`

**3. [Rule 1 - Bug] photos.upload returns fileName reference, not URL**
- **Found during:** Task 3 (Sandbox verification)
- **Issue:** Plan assumed URL in response; actual API returns `fileName` string for use in template params
- **Fix:** Changed `extractPhotoUrl` → `extractPhotoRef`, checking `photo.fileName ?? photo.url ?? photo.photoUrl ?? photo.fileUrl`
- **Files modified:** `backend/src/routes/sweetbook.ts`
- **Verification:** Subsequent covers.create and contents.insert accepted the fileName references
- **Committed in:** `def6966`

**4. [Rule 1 - Bug] Cover template requires dateRange parameter**
- **Found during:** Task 3 (Sandbox verification)
- **Issue:** Template `79yjMH3qRPly` has a required `dateRange` field — covers.create returned validation error without it
- **Fix:** Added `dateRange: new Date().getFullYear().toString()` to covers.create params
- **Files modified:** `backend/src/routes/sweetbook.ts`
- **Verification:** covers.create succeeded after adding dateRange
- **Committed in:** `def6966`

**5. [Rule 1 - Bug] Content template parameter fields differ from plan**
- **Found during:** Task 3 (Sandbox verification)
- **Issue:** Template `2R8uMwVgTrpc` uses `photo1` (not `photo`) and `{ date, title, diaryText }` (not `text`)
- **Fix:** Updated contents.insert params to `{ photo1: photoRefs[i], date: today, title: \`${i+1}화\`, diaryText: record.pages[i].text }`
- **Files modified:** `backend/src/routes/sweetbook.ts`
- **Verification:** contents.insert accepted params for all 16 pages
- **Committed in:** `def6966`

**6. [Rule 2 - Missing Critical] SQUAREBOOK_HC requires 24-page minimum**
- **Found during:** Task 3 (Sandbox verification)
- **Issue:** 16 content pages fell below the 24-page minimum for SQUAREBOOK_HC — finalize failed
- **Fix:** Added Step 4b: insert `Math.max(0, 24 - record.pages.length)` blank pages using template `2mi1ao0Z4Vxl`
- **Files modified:** `backend/src/routes/sweetbook.ts`
- **Verification:** books.finalize succeeded after adding 8 blank pages
- **Committed in:** `def6966`

---

**Total deviations:** 6 auto-fixed (5 bugs, 1 missing critical)
**Impact on plan:** All fixes required for correct Sweetbook API integration. No scope creep — each fix was a direct API constraint discovered during sandbox testing.

## Issues Encountered

- SWEETBOOK_CONTENT_TEMPLATE_UID value in `.env` was updated to `2R8uMwVgTrpc` during verification (was placeholder). Not a code issue.

## User Setup Required

`backend/.env` must contain (already configured for sandbox verification):
- `SWEETBOOK_API_KEY` — Sweetbook sandbox API key
- `SWEETBOOK_COVER_TEMPLATE_UID` — `79yjMH3qRPly` (verified working)
- `SWEETBOOK_CONTENT_TEMPLATE_UID` — `2R8uMwVgTrpc` (verified working)

## Known Stubs

None — all routes are fully wired and sandbox-verified.

## Next Phase Readiness

- POST /api/sweetbook/books and POST /api/sweetbook/orders sandbox-verified end-to-end
- Phase 4 (Frontend UI) can wire the complete flow: generate-book → sweetbook/books → sweetbook/orders
- No blockers

## Self-Check: PASSED

- FOUND: `backend/src/routes/sweetbook.ts`
- FOUND: `backend/src/services/sweebookClient.ts`
- FOUND: `backend/src/index.ts`
- FOUND: `.planning/phases/03-sweetbook-api-integration/03-02-SUMMARY.md`
- FOUND commit: `9297a42` (feat: sweetbook routes)
- FOUND commit: `d8dec22` (feat: index.ts mount)
- FOUND commit: `def6966` (fix: sandbox verification fixes)

---
*Phase: 03-sweetbook-api-integration*
*Completed: 2026-04-01*
