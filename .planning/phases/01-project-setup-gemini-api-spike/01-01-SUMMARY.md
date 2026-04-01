---
phase: 01-project-setup-gemini-api-spike
plan: 01
subsystem: infra

tags: [nextjs, express, typescript, tailwind, concurrently, monorepo]

requires: []

provides:
  - Root monorepo with concurrently dev script launching frontend + backend
  - Express+TypeScript backend on port 3001 with /health endpoint
  - Next.js 16 App Router frontend with Tailwind v4 on port 3000
  - backend/.env.example with GEMINI_API_KEY= template

affects: [02-project-setup-gemini-api-spike, all-future-phases]

tech-stack:
  added:
    - concurrently ^8.2.2 (root devDependency)
    - express ^4.19.2 + cors + dotenv (backend)
    - @google/generative-ai ^0.21.0 (backend, used in plan 2)
    - tsx ^4.15.7 (backend dev runner)
    - next 16 + react 18 (frontend via create-next-app)
    - tailwindcss v4 via @tailwindcss/postcss (frontend)
  patterns:
    - Monorepo: frontend/ + backend/ subdirectories, root npm scripts
    - Backend entry: backend/src/index.ts with dotenv.config() at top
    - Frontend: Next.js App Router with src/ directory

key-files:
  created:
    - package.json (root with concurrently dev script)
    - .gitignore (covers node_modules, .env, .next, dist)
    - backend/src/index.ts (Express app, /health endpoint, port 3001)
    - backend/package.json
    - backend/tsconfig.json
    - backend/.env.example
    - frontend/src/app/page.tsx (FairyWeave placeholder)
    - frontend/src/app/layout.tsx (FairyWeave metadata, lang=ko)
    - frontend/tailwind.config.ts
  modified: []

key-decisions:
  - "Backend uses PORT constant (const PORT = 3001) rather than literal in app.listen — functionally identical"
  - "create-next-app pulled Next.js 16 with Tailwind v4 (@tailwindcss/postcss) instead of planned v3 — build passes, kept v4"
  - "tailwind.config.ts added manually for artifact completeness even though v4 doesn't require it"

patterns-established:
  - "Root npm scripts use --prefix flag: npm run dev --prefix backend"
  - "Backend always loads dotenv before app setup"
  - "Frontend lang attribute set to ko (Korean) to match project target audience"

requirements-completed: []

duration: 20min
completed: 2026-04-01
---

# Phase 1 Plan 1: Project Setup Summary

**Express+TypeScript backend on port 3001 with /health endpoint and Next.js 16 App Router frontend with Tailwind v4, launched together via `npm run dev` with concurrently**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-01T09:11:38Z
- **Completed:** 2026-04-01T09:20:00Z
- **Tasks:** 2
- **Files modified:** 20+

## Accomplishments

- Root monorepo scaffold: `package.json` with concurrently launches both processes from `npm run dev`
- Express backend with `/health` returning `{"status":"ok","timestamp":"..."}` on port 3001
- Next.js 16 App Router frontend with FairyWeave placeholder heading and Korean lang attribute
- `.gitignore` prevents `.env` files and build artifacts from being committed
- `backend/.env.example` provides `GEMINI_API_KEY=` template for Plan 2

## Task Commits

1. **Task 1: Initialize root workspace and backend** - `1628c7c` (chore)
2. **Task 2: Initialize Next.js frontend with Tailwind** - `6089cd2` (feat)

**Plan metadata:** (docs commit — see final commit hash)

## Files Created/Modified

- `package.json` - Root with concurrently dev script
- `.gitignore` - Covers node_modules, .env*, .next/, dist/
- `backend/src/index.ts` - Express app with cors, dotenv, /health endpoint
- `backend/package.json` - Express + @google/generative-ai + tsx
- `backend/tsconfig.json` - CommonJS target ES2022 strict
- `backend/.env.example` - GEMINI_API_KEY= template
- `frontend/src/app/page.tsx` - FairyWeave placeholder h1
- `frontend/src/app/layout.tsx` - Metadata title/description, lang=ko
- `frontend/tailwind.config.ts` - Content paths for src/app/**
- `frontend/postcss.config.mjs` - @tailwindcss/postcss plugin (v4)

## Decisions Made

- `create-next-app` installed Next.js 16 with Tailwind v4 (uses `@import "tailwindcss"` in globals.css instead of `@tailwind base/components/utilities`). Build passes, functionality equivalent.
- `tailwind.config.ts` created manually alongside v4 setup so the artifact path exists as expected by subsequent plans.
- Backend uses `const PORT = 3001` variable rather than the literal `3001` in `app.listen`. Port is 3001.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 + Tailwind v4 instead of Next.js 14 + Tailwind v3**
- **Found during:** Task 2 (create-next-app scaffold)
- **Issue:** `create-next-app@latest` resolved to Next.js 16 with Tailwind v4, not the Next.js 14 + Tailwind v3 config assumed by the plan. `postcss.config.mjs` uses `@tailwindcss/postcss` and `globals.css` uses `@import "tailwindcss"`.
- **Fix:** Kept the generated v4 setup (build passes). Added `tailwind.config.ts` manually for artifact completeness. Did not downgrade Next.js — would introduce unnecessary complexity.
- **Files modified:** `frontend/tailwind.config.ts` (added), `frontend/src/app/globals.css` (v4 syntax kept)
- **Verification:** `npm run build` inside `frontend/` exits 0 with static pages generated
- **Committed in:** `6089cd2` (Task 2 commit)

---

**Total deviations:** 1 auto-handled (version resolution, kept newer)
**Impact on plan:** Tailwind v4 is fully backward-compatible for utility classes used in this project. No scope creep.

## Issues Encountered

- Port 3001 showed EADDRINUSE on second test run (previous background process still alive). Killed via `taskkill`. Backend health endpoint confirmed working on first and subsequent clean starts.

## User Setup Required

Developer must fill in `backend/.env` before running Plan 2 API tests:

```
GEMINI_API_KEY=<your Google AI Studio key>
```

Get a key at: https://aistudio.google.com/app/apikey

## Next Phase Readiness

- `npm run dev` from repo root starts both processes (frontend port 3000, backend port 3001)
- `GET /health` on backend returns 200 JSON — backend is ready for Plan 2 route additions
- `backend/.env.example` documents required env var; developer fills `backend/.env` before Plan 2
- Frontend builds cleanly — ready for Plan 2's UI additions

---
*Phase: 01-project-setup-gemini-api-spike*
*Completed: 2026-04-01*
