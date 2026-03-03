---
phase: 03-calculation-engine
plan: "01"
subsystem: calculation
tags: [decimal.js, vitest, financial-calculations, alberta, carbon-credits, net-metering]

# Dependency graph
requires:
  - phase: 01-foundation-data-schema
    provides: "AlbertaConfig type, d() helper, ProposalInputs/ProposalOutputs types"
  - phase: 02-manual-entry
    provides: "paulFriesenInputs fixture with 12-month production/consumption data"
provides:
  - "paulFriesenConfig AlbertaConfig fixture with 10-entry Alberta carbon benchmark schedule"
  - "utility-projection.ts: projectUtilityCosts() geometric series projection (CALC-01)"
  - "net-metering.ts: computeMonthlyNetMetering() and computeNetMeteringProjection() (CALC-02/03/04)"
  - "carbon-credits.ts: computeCarbonCredits() with CO2 avoidance + 10-year payout range (CALC-05)"
  - "cash-back.ts: computeCashBack() escalated grid purchase cash-back (CALC-06)"
  - "savings.ts: computeSavingsSummary() and computeFinanceOption() (CALC-07/CALC-08)"
  - "domain-modules.test.ts: 31 Vitest tests covering all calculation domains"
affects:
  - "03-02: assembles these sub-modules into calculateProposal() public API"
  - "03-03: server action wiring and Generate button upgrade"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Domain-split engine modules: each CALC requirement in its own file under src/lib/engine/"
    - "TDD red-green cycle: failing tests committed before implementation"
    - "All Decimal arithmetic via d('string') helper, no float literals, no intermediate toFixed()"
    - "production.greaterThanOrEqualTo(consumption) for surplus detection (locked decision)"
    - "Array index 0 = Year 1 for projection arrays (no Year 0 stored)"

key-files:
  created:
    - src/test-data/paul-friesen-config.ts
    - src/lib/engine/utility-projection.ts
    - src/lib/engine/net-metering.ts
    - src/lib/engine/carbon-credits.ts
    - src/lib/engine/cash-back.ts
    - src/lib/engine/savings.ts
    - src/lib/engine/__tests__/domain-modules.test.ts
  modified: []

key-decisions:
  - "Carbon benchmark schedule uses approximated 2024 Alberta values ($65-$230/tonne, Years 1-10); CALC-05 tests assert range condition (45-65% of gross credit) rather than exact dollar values for robustness"
  - "computeFinanceOption uses base-year (Year 0) values for monthly snapshot — no escalation applied, matching 'current year comparison' framing"
  - "greaterThanOrEqualTo (>=) for surplus detection per locked CONTEXT.md decision — production == consumption treated as surplus (gridBuyKwh = 0)"
  - "carbonBenchmarkSchedule entries carry pre-computed payoutLow/payoutHigh; computeCarbonCredits multiplies by annualCo2Avoided (not re-multiplying by price)"

patterns-established:
  - "Pattern: Pure sub-calculation functions — each domain module exports named pure functions, no side effects"
  - "Pattern: Vitest assertions use .toFixed(N) string comparison for monetary values, .toHaveLength() for arrays"
  - "Pattern: TDD for all engine modules — failing test commit precedes implementation commit"

requirements-completed: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08]

# Metrics
duration: 12min
completed: 2026-03-03
---

# Phase 03 Plan 01: Domain Sub-Calculation Modules Summary

**Five pure TypeScript calculation modules (CALC-01 through CALC-08) implemented with Decimal.js arithmetic, TDD-verified by 31 Vitest tests against Paul Friesen reference values**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-03T01:17:49Z
- **Completed:** 2026-03-03T01:19:40Z
- **Tasks:** 2
- **Files modified:** 7 created

## Accomplishments

- paulFriesenConfig AlbertaConfig fixture with 10-year Alberta carbon benchmark schedule eliminates Supabase dependency from all engine tests
- Five domain sub-calculation modules implement CALC-01 through CALC-08 using Decimal.js with full precision (no intermediate rounding)
- 31 Vitest tests cover all calculation domains including edge cases (equal production/consumption, negative savings, zero escalation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create paulFriesenConfig fixture** - `f8338e1` (feat)
2. **Task 2 RED: Failing tests for domain modules** - `3657289` (test)
3. **Task 2 GREEN: Implement domain modules** - `2334f17` (feat)

## Files Created/Modified

- `src/test-data/paul-friesen-config.ts` - Static AlbertaConfig fixture with 10-entry Alberta carbon benchmark schedule (Years 1-10, $65-$230/tonne)
- `src/lib/engine/utility-projection.ts` - CALC-01: `projectUtilityCosts()` geometric series over N years
- `src/lib/engine/net-metering.ts` - CALC-02/03/04: `computeMonthlyNetMetering()` + `computeNetMeteringProjection()`
- `src/lib/engine/carbon-credits.ts` - CALC-05: `computeCarbonCredits()` returning `CarbonCreditProjection`
- `src/lib/engine/cash-back.ts` - CALC-06: `computeCashBack()` escalated grid purchase cash-back
- `src/lib/engine/savings.ts` - CALC-07/08: `computeSavingsSummary()` + `computeFinanceOption()`
- `src/lib/engine/__tests__/domain-modules.test.ts` - 31 Vitest tests, all passing

## Decisions Made

- **Carbon benchmark values:** Used approximated Alberta 2024 schedule ($65-$230/tonne over 10 years). CALC-05 tests assert range condition rather than exact dollar values — more robust against fixture value updates.
- **Finance option base year:** `computeFinanceOption` uses base-year (Year 0) figures with no escalation. This is the "current year comparison" snapshot for Page 5 monthly cost display.
- **Surplus detection:** `production.greaterThanOrEqualTo(consumption)` — equal production/consumption treated as surplus (gridBuyKwh = 0, surplusSoldKwh = 0). Locked per CONTEXT.md.
- **Carbon payout formula:** `entry.payoutLow` in `CarbonBenchmarkEntry` is already `pricePerTonne × payoutPercentageLow` (pre-computed in fixture). `computeCarbonCredits` multiplies by `annualCo2Avoided` only — avoids double-multiplying by percentage.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly on first attempt. All 31 tests passed immediately on GREEN phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All five domain modules are independently importable and callable with Decimal inputs
- Plan 02 can now assemble these modules into `calculateProposal(inputs, config): ProposalOutputs`
- Test fixture `paulFriesenConfig` ready for reuse in all Phase 3 tests
- No blockers

## Self-Check: PASSED

- FOUND: src/test-data/paul-friesen-config.ts
- FOUND: src/lib/engine/utility-projection.ts
- FOUND: src/lib/engine/net-metering.ts
- FOUND: src/lib/engine/carbon-credits.ts
- FOUND: src/lib/engine/cash-back.ts
- FOUND: src/lib/engine/savings.ts
- FOUND: src/lib/engine/__tests__/domain-modules.test.ts
- FOUND commit: f8338e1 (feat(03-01): add paulFriesenConfig AlbertaConfig test fixture)
- FOUND commit: 3657289 (test(03-01): add failing tests for domain sub-calculation modules)
- FOUND commit: 2334f17 (feat(03-01): implement five domain sub-calculation modules)
- TypeScript compiles cleanly (npx tsc --noEmit: no output)
- 31 Vitest tests: all passing

---
*Phase: 03-calculation-engine*
*Completed: 2026-03-03*
