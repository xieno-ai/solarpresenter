---
phase: 07-bill-extraction
plan: 02
subsystem: navigation
tags: [landing-hub, routing, homepage, redirect]
dependency_graph:
  requires: []
  provides: [landing-hub-at-root, proposal-redirect-to-enter]
  affects: [src/app/page.tsx, next.config.ts]
tech_stack:
  added: []
  patterns: [Next.js redirects with missing guard, server component static page]
key_files:
  created: []
  modified:
    - src/app/page.tsx
    - next.config.ts
decisions:
  - "Used next.config.ts redirects array (not a page.tsx) for /proposal → /enter to avoid overwriting the proposal renderer at src/app/proposal/page.tsx"
  - "missing: [{type: 'query', key: 'd'}] guard ensures /proposal?d=<base64> still reaches the renderer"
  - "307 temporary redirect chosen over 301 permanent — easier to change during testing"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-04"
  tasks_completed: 2
  files_modified: 2
---

# Phase 7 Plan 02: Landing Hub and /proposal Redirect Summary

**One-liner:** Static dark-theme landing hub at / with two tool cards (Proposal Creator → /enter, Bill Extractor → /bill) plus a framework-level /proposal → /enter redirect that guards the renderer's ?d= query param.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Replace homepage with landing hub | 5a4ca10 | src/app/page.tsx |
| 2 | Add /proposal → /enter redirect | fa1d343 | next.config.ts |

## What Was Built

**Task 1 — Landing Hub (src/app/page.tsx)**

Completely replaced the Phase 1 smoke test page with a clean server component landing hub. The new page uses the same dark theme (neutral-950 bg, amber-400 accents) as the rest of the app. Two tool cards in a responsive grid (stacks on mobile, side-by-side on md+) each link to their respective routes. Each card has a document/upload SVG icon, tool name, description, and amber arrow indicator with hover translation animation.

**Task 2 — /proposal Redirect (next.config.ts)**

Added an async `redirects()` function to `next.config.ts`. The redirect uses `missing: [{type: 'query', key: 'd'}]` so it only fires when the `d` query param is absent. This means:
- `/proposal` (bare) → redirects 307 to `/enter`
- `/proposal?d=<base64>` → passes through to the proposal renderer as normal

This approach avoids the file collision: `src/app/proposal/page.tsx` is the proposal renderer itself, so we cannot add a redirect page there.

## Verification

- No smoke test imports in new page.tsx (paulFriesenInputs, getAlbertaConfig, Decimal.js all removed)
- Both tool card href values confirmed: /enter and /bill
- next.config.ts redirect has `missing: [{type: 'query', key: 'd'}]` guard
- src/app/proposal/page.tsx untouched
- TypeScript compiles cleanly for all files touched by this plan (pre-existing TS error in extract-bill/route.ts is out of scope — existed before this plan)

## Deviations from Plan

None — plan executed exactly as written. The plan already anticipated the route collision and specified the next.config.ts approach as the correct solution.

## Self-Check: PASSED

- src/app/page.tsx: FOUND (modified, 2 tool cards with /enter and /bill hrefs)
- next.config.ts: FOUND (redirects array with missing guard)
- Commits: 5a4ca10 (landing hub) and fa1d343 (redirect) both present
