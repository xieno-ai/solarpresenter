---
phase: quick-10
plan: 10
subsystem: scraper, form
tags: [scraper, monthly-values, form-sync, consumption]
dependency_graph:
  requires: []
  provides: [monthly-first-sync, scraper-monthly-priority]
  affects: [src/components/form/MonthlyGrid.tsx, src/lib/scraper/sunpitch.ts]
tech_stack:
  added: []
  patterns: [monthly-first guard, infoType-agnostic monthlyUsage detection]
key_files:
  created: []
  modified:
    - src/components/form/MonthlyGrid.tsx
    - src/lib/scraper/sunpitch.ts
decisions:
  - "MonthlyGrid annual→monthly distribution skips when monthlySum > 0 — monthly values always win"
  - "sunpitch.ts prefers monthlyUsage array in ALL branches (AvgYearlyUsage and else) before falling back to annual+curve"
metrics:
  duration: 1min
  completed_date: "2026-03-04"
---

# Quick Task 10: Monthly Values Priority — Use Monthly Data Summary

**One-liner:** Monthly-first priority enforced in both MonthlyGrid form sync and sunpitch.ts scraper, so scraped monthly consumption values are always preserved and used.

## What Was Done

Two gaps in the monthly values priority system were closed:

1. **MonthlyGrid.tsx** — The annual→monthly distribution useEffect now returns early when the sum of existing monthly values is greater than zero. This prevents the form from overwriting scraped or manually entered monthly values when the annual field changes.

2. **sunpitch.ts** — The consumption parsing block now tries `info.monthlyUsage` in all code paths:
   - `AvgYearlyUsage` branch: if `monthlyUsage` array is also present, prefer it over annual+curve distribution
   - `else` branch (previously "try generic annual keys"): check for `monthlyUsage` array first before falling back to annual keys

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Skip annual→monthly distribution when monthly values are non-zero | 2bee608 | MonthlyGrid.tsx |
| 2 | Try monthlyUsage array regardless of infoType in scraper | ff26423 | sunpitch.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/components/form/MonthlyGrid.tsx` — `monthlySum > 0` guard present in annual→monthly effect
- [x] `src/lib/scraper/sunpitch.ts` — `Array.isArray(info.monthlyUsage)` check present in both `AvgYearlyUsage` and `else` branches
- [x] `npx tsc --noEmit` passes with no errors
- [x] Both commits exist: 2bee608, ff26423
