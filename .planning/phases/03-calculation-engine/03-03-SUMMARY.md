---
phase: 03-calculation-engine
plan: "03"
status: complete
completed: "2026-03-03"
---

# Plan 03-03 Summary: Wire /enter Page to Real Calculation Output

## What Was Built

- `src/app/actions/calculate.ts` — server action (`runCalculation`) that fetches `AlbertaConfig` from Supabase, converts `ProposalFormValues` strings to `Decimal` via `d()`, calls `calculateProposal()`, then serializes all Decimal fields to strings for JSON transport across the server/client boundary. Exports `SerializedProposalOutputs` type with full structure.
- `src/app/enter/page.tsx` — updated to call `runCalculation` instead of the Phase 2 ProposalInputs stub. Displays a 4-metric summary card (Solar Offset, 20-Year Utility Cost, 20-Year Savings, CO₂ Avoided/yr) plus an expandable full JSON dump for debugging.

## Bug Found and Fixed

**Bug:** `tenYearPayoutLow` and `tenYearPayoutHigh` returned as `"0"` despite non-zero benchmark schedule.

**Root cause:** `computeCarbonCredits` filtered `config.carbonBenchmarkSchedule.filter(entry => entry.year <= 10)`. The test fixture uses relative years (1–10) so this worked in tests. Supabase stores calendar years (2025, 2026, …), so all entries were filtered out.

**Fix:** Changed to `config.carbonBenchmarkSchedule.slice(0, 10)` — takes the first 10 entries regardless of whether year values are relative or calendar years. All 72 tests still pass.

## Human Verify Results

Tested with Paul Friesen reference data (12000 kWh/yr consumption, 1000 kWh/month uniform):

| Metric | Observed |
|--------|----------|
| Solar Offset | 118.975% |
| 20-Year Utility Cost | $69,994 |
| 20-Year Savings | $84,758 |
| CO₂ Avoided/yr | 7.85235 t |
| Annual Grid Purchase Cost | $231.67 |
| Annual Sell Revenue | $1,224.76 |
| Carbon credits (tenYearPayoutLow) | Non-zero after bug fix |

Note: Test fixture uses 15408 kWh/yr (annualCo2Avoided = 8.4744 t). User entered different numbers during verify (lower consumption/production), yielding 7.85235 t — consistent with formula.

Supabase config loaded successfully. All CALC-01 through CALC-08 requirements satisfied end-to-end.

## Tests

- 72 tests pass across 3 suites
- `decimal.test.ts` pre-existing empty file (no describe/it blocks) — not introduced by this plan

## Phase 3 Status

All 3 plans complete. Phase 3 — Calculation Engine — is **DONE**.
- 03-01: Domain sub-modules (5 modules, CALC-01 through CALC-08)
- 03-02: `calculateProposal()` public API + 24 integration tests
- 03-03: Server action + /enter page wired to real engine, carbon credits bug fixed
