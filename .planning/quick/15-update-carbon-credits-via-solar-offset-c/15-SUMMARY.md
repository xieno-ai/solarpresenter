---
phase: quick-15
plan: 15
subsystem: calculation-engine
tags: [carbon-credits, solaroffset, gdf, engine, tdd]
dependency_graph:
  requires: []
  provides: [carbon-credits-solaroffset-gdf]
  affects: [carbon-credits-page, proposal-outputs, finance-option]
tech_stack:
  added: []
  patterns: [hardcoded-schedule, tiered-platform-fee, tdd-red-green]
key_files:
  created: []
  modified:
    - src/lib/engine/carbon-credits.ts
    - src/lib/engine/calculate.ts
    - src/lib/engine/__tests__/domain-modules.test.ts
    - src/lib/engine/__tests__/calculate.test.ts
    - src/app/proposal/pages/CarbonCreditsPage.tsx
decisions:
  - "SolarOffset.ca GDF schedule hardcoded (2026-2035) — values are stable, no Supabase needed"
  - "Platform fee tiered by kWp: 45% (<5), 30% (5-30), 25% (>=30) — matches SolarOffset.ca tiers"
  - "annualCo2Avoided uses Year 1 GDF (0.4588) as representative display value only"
  - "benchmarkSchedule rows all show same per-tonne owner rates — GDF only affects yearly totals"
  - "Plan expected annualCo2Avoided=7.0731504 was arithmetic error; correct value is 7.0691904"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-04"
  tasks_completed: 2
  files_modified: 5
---

# Phase quick-15 Plan 15: Update Carbon Credits via SolarOffset.ca GDF Schedule Summary

**One-liner:** Replaced static 0.55 t/MWh Alberta grid factor with SolarOffset.ca's declining GDF schedule (2026-2035) and tiered platform fees (25-45% by system size).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Replace computeCarbonCredits with SolarOffset.ca GDF logic (TDD) | fc98735 | carbon-credits.ts, domain-modules.test.ts |
| 2 | Wire updated engine call site and fix UI footnote | 0d261db | calculate.ts, calculate.test.ts, CarbonCreditsPage.tsx |

## What Was Built

### Task 1: New carbon-credits.ts engine

Rewrote `computeCarbonCredits` with:
- `SOLAROFFSET_SCHEDULE` constant: 10 GDF values for years 2026-2035 (0.4588 declining to 0.2752)
- Fixed prices: `PRICE_LOW = $57/tonne`, `PRICE_HIGH = $76/tonne`
- `platformFee()` helper: tiered by system kWp (45% / 30% / 25%)
- New signature: `(annualProductionKwh, systemSizeKw)` — no longer requires `AlbertaConfig`
- `annualCo2Avoided`: uses Year 1 GDF as representative display value
- `tenYearPayoutLow/High`: sums per-year CO2 × price × ownerKeep across all 10 years
- `benchmarkSchedule`: 10 entries with calendar years 2026-2035, uniform per-tonne owner rates

For Paul Friesen (12.24 kWp, 5-30 range → 30% fee → 70% owner keep):
- annualCo2Avoided = 15408/1000 × 0.4588 = 7.0692 tonnes
- Owner price low = $57 × 0.70 = $39.90/tonne
- Owner price high = $76 × 0.70 = $53.20/tonne

### Task 2: Engine wiring + UI footnote

- `calculate.ts`: updated `computeCarbonCredits` call to pass `inputs.system.systemSizeKw` instead of `config`
- `CarbonCreditsPage.tsx`: footnote updated from "0.55 t/MWh Alberta grid factor" to "SolarOffset.ca GDF schedule (2026-2035)"
- `calculate.test.ts`: updated CALC-05 assertions to new GDF-based CO2 value

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan had arithmetic error in expected CO2 value**
- **Found during:** Task 1 RED→GREEN transition
- **Issue:** Plan stated `annualCo2Avoided` should be `7.0731504` but `15.408 × 0.4588 = 7.0691904` (verified with Node.js)
- **Fix:** Updated test assertion to `7.0691904` (7 decimal places) and `7.0692` (4 decimal places) in integration test
- **Files modified:** domain-modules.test.ts, calculate.test.ts

**2. [Rule 1 - Bug] calculate.test.ts had stale CALC-05 assertions referencing old 0.55 GDF**
- **Found during:** Task 2 full test run
- **Issue:** calculate.test.ts still asserted `annualCo2Avoided = 8.4744` (old static factor)
- **Fix:** Updated to new GDF-based value and corrected benchmark schedule length assertion
- **Files modified:** calculate.test.ts
- **Commit:** 0d261db

### Out-of-Scope Discoveries

- `src/lib/decimal/decimal.test.ts` fails with "No test suite found" — pre-existing issue (uses custom runner without vitest describe/it blocks). Logged to deferred-items.

## Self-Check

**Created files:**
- .planning/quick/15-update-carbon-credits-via-solar-offset-c/15-SUMMARY.md — this file

**Modified files verified:**
- src/lib/engine/carbon-credits.ts — FOUND (rewritten)
- src/lib/engine/calculate.ts — FOUND (updated call site)
- src/lib/engine/__tests__/domain-modules.test.ts — FOUND (updated CALC-05)
- src/lib/engine/__tests__/calculate.test.ts — FOUND (updated CALC-05)
- src/app/proposal/pages/CarbonCreditsPage.tsx — FOUND (updated footnote)

**Commits verified:**
- fc98735 — Task 1
- 0d261db — Task 2

## Self-Check: PASSED
