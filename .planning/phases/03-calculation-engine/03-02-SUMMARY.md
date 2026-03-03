---
phase: 03-calculation-engine
plan: "02"
subsystem: calculation
tags: [decimal.js, vitest, tdd, calculateProposal, integration-test, alberta]

# Dependency graph
requires:
  - phase: 03-calculation-engine
    plan: "01"
    provides: "Five domain sub-modules: utility-projection, net-metering, carbon-credits, cash-back, savings"
provides:
  - "calculateProposal(inputs, config): ProposalOutputs — public calculation API"
  - "calculate.test.ts: 24 Vitest integration tests covering all 8 CALC-* requirements"
affects:
  - "03-03: server action wiring uses calculateProposal() as the engine entry point"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD integration test: beforeAll() calls calculateProposal once, all describe blocks share outputs"
    - "Reference value assertions: .toFixed(N) string comparison for monetary Decimal values"
    - "Structural assertions: greaterThan(), lessThan(), isFinite() for relational checks"

key-files:
  created:
    - src/lib/engine/__tests__/calculate.test.ts
  modified:
    - src/lib/engine/calculate.ts

key-decisions:
  - "carbonCredits field in SavingsSummary passes tenYearPayoutLow (10-year total) — same value used for both 20-year and 30-year horizons (conservative carbon estimate)"
  - "annualCarbonCredit for finance option = tenYearPayoutLow / 10 (average annual, used as proxy for current-year monthly snapshot)"
  - "cashBackYear1 uses Year 1 escalated grid cost (annualGridPurchaseCost × (1 + escalationRate) × cashBackRate) for finance option — consistent with computeCashBack() internal behavior"
  - "REFACTOR not needed: implementation matched plan spec exactly on first GREEN run"

patterns-established:
  - "Pattern: Integration test file per public API entry point (calculate.test.ts wraps calculateProposal)"
  - "Pattern: beforeAll() single-call with shared outputs object across all CALC-* describe blocks"

requirements-completed: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 03 Plan 02: calculateProposal Integration Summary

**calculateProposal(inputs, config) assembled from five domain modules and verified by 24 Vitest integration tests covering all 8 CALC-* requirements against Paul Friesen reference values**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T01:22:17Z
- **Completed:** 2026-03-03T01:23:45Z
- **Tasks:** 1 (RED + GREEN TDD cycle)
- **Files modified:** 2 (1 created, 1 replaced)

## Accomplishments

- calculateProposal() replaces the Phase 1 stub with a complete implementation assembling all 5 domain sub-modules
- 24 Vitest integration tests verify all CALC-01 through CALC-08 requirements against Paul Friesen reference values
- All tests pass on first GREEN attempt — no REFACTOR cycle needed
- TypeScript compiles cleanly (npx tsc --noEmit: no output)

## Test Results

**72 total tests pass across all test files (0 failures in scope):**

- `calculate.test.ts`: 24 tests, all passing
  - CALC-01: 4 assertions (projection lengths, Year 1 value 4422.60, sum check)
  - CALC-02: 5 assertions (length=12, Jan deficit, Jun surplus, Mar surplus, Dec deficit)
  - CALC-03: 4 assertions (annual totals > 0, sum-match checks)
  - CALC-04: 1 assertion (escalation makes 20yr revenue > flat × 20)
  - CALC-05: 4 assertions (co2Avoided=8.4744, schedule length, payout range)
  - CALC-06: 3 assertions (cashBack > 0, 30yr > 20yr, ratio < 1)
  - CALC-07: 3 assertions (netSavingsAfterCost formula, totalSavings sum, 30yr > 20yr)
  - CALC-08: 3 assertions (monthlyAllInCost > 0, totalMonthlyPayment=189, isFinite)
  - solarOffsetPercent: 1 assertion (128.40)
  - twentyYearSavings: 1 assertion (equals netSavingsAfterCost)
- `domain-modules.test.ts`: 31 tests (from Plan 01), all passing
- `form-lib.test.ts`: 17 tests, all passing

**Pre-existing out-of-scope failure:** `decimal.test.ts` reports "No test suite found" — empty file with no describe blocks. This predates this plan and is logged to deferred-items.

## Task Commits

1. **RED: Failing tests** - `ee31c77` (test)
2. **GREEN: Implementation** - `af4eea5` (feat)

## Reference Values Confirmed

| Assertion | Expected | Source |
|-----------|----------|--------|
| `solarOffsetPercent.toFixed(2)` | `'128.40'` | 15408 / 12000 × 100 |
| `annualCo2Avoided.toFixed(4)` | `'8.4744'` | 15408 / 1000 × 0.55 |
| `utilityProjection20Year[0].toFixed(2)` | `'4422.60'` | 4212 × 1.05^1 |
| `monthlyNetMetering[0].gridBuyKwh.toFixed(0)` | `'452'` | 1100 - 648 |
| `monthlyNetMetering[5].surplusSoldKwh.toFixed(0)` | `'914'` | 1764 - 850 |
| `monthlyNetMetering[2].surplusSoldKwh.toFixed(0)` | `'188'` | 1188 - 1000 |
| `monthlyNetMetering[11].gridBuyKwh.toFixed(0)` | `'610'` | 1150 - 540 |
| `financeOption.totalMonthlyPayment.toFixed(2)` | `'189.00'` | pass-through |

## Formula Interpretation Decisions

- **Carbon credits for savings:** `tenYearPayoutLow` (10-year cumulative) is used for both 20-year and 30-year SavingsSummary `carbonCredits` field. This is conservative — the plan spec used this same value for both horizons.
- **Finance option carbon credit:** `tenYearPayoutLow / 10` gives an average annual figure for the monthly snapshot calculation. Consistent with "base-year comparison" framing.
- **cashBackYear1:** Computed as `annualGridPurchaseCost × (1 + escalationRate) × cashBackRate` to match the Year 1 escalated value that `computeCashBack()` would produce for year 1.

## Files Created/Modified

- `src/lib/engine/calculate.ts` — replaced stub with full implementation; exports `calculateProposal(inputs: ProposalInputs, config: AlbertaConfig): ProposalOutputs`
- `src/lib/engine/__tests__/calculate.test.ts` — 24 integration tests covering all 8 CALC-* requirements

## Deviations from Plan

None - plan executed exactly as written. Implementation matched plan spec on first GREEN run with no REFACTOR cycle needed.

## Deferred Items

- `src/lib/decimal/decimal.test.ts`: Pre-existing "No test suite found" error — file exists but contains no describe/test blocks. Out of scope for this plan. Logged to deferred-items.

## Self-Check: PASSED

- FOUND: src/lib/engine/calculate.ts
- FOUND: src/lib/engine/__tests__/calculate.test.ts
- FOUND commit: ee31c77 (test(03-02): add failing tests for calculateProposal integration)
- FOUND commit: af4eea5 (feat(03-02): implement calculateProposal() assembling all domain modules)
- TypeScript compiles cleanly (npx tsc --noEmit: no output)
- 72 Vitest tests pass (0 failures in scope)
- solarOffsetPercent.toFixed(2) === '128.40': VERIFIED
- annualCo2Avoided.toFixed(4) === '8.4744': VERIFIED
- utilityProjection20Year length === 20: VERIFIED

---
*Phase: 03-calculation-engine*
*Completed: 2026-03-03*
