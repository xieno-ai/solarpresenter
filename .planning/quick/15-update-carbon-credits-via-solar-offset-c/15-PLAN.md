---
phase: quick-15
plan: 15
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/engine/carbon-credits.ts
  - src/lib/engine/calculate.ts
  - src/lib/engine/__tests__/domain-modules.test.ts
  - src/app/proposal/pages/CarbonCreditsPage.tsx
autonomous: true
requirements: [QUICK-15]
must_haves:
  truths:
    - "Carbon credit calculation uses per-year GDF values from SolarOffset.ca (2026-2035)"
    - "Platform fee is tiered by system size kWp (45% for 3-5kWp, 30% for 5-30kWp, 25% for 30-500kWp)"
    - "annualCo2Avoided uses the Year 1 GDF as the representative display value"
    - "10-year total payout (low/high) reflects owner revenue after platform fee"
    - "Tests pass with updated expected values"
  artifacts:
    - path: "src/lib/engine/carbon-credits.ts"
      provides: "computeCarbonCredits with SolarOffset.ca GDF logic"
    - path: "src/lib/engine/calculate.ts"
      provides: "Updated call passing systemSizeKw to computeCarbonCredits"
  key_links:
    - from: "src/lib/engine/calculate.ts"
      to: "src/lib/engine/carbon-credits.ts"
      via: "computeCarbonCredits(annualProductionKwh, systemSizeKw)"
      pattern: "computeCarbonCredits"
---

<objective>
Replace the carbon credits engine with SolarOffset.ca GDF-based logic.

Purpose: The existing engine uses a static grid emission factor (0.55 t/MWh) and Supabase-sourced price schedule with fixed payout percentages (45%/65%). SolarOffset.ca uses declining per-year GDF values (2026-2035) with fixed prices ($57/$76/tonne) and platform fees tiered by system size (not a flat percentage).

Output: Updated carbon-credits.ts with hardcoded GDF schedule, updated engine wiring, updated tests, updated UI footnote.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/lib/engine/carbon-credits.ts
@src/lib/engine/calculate.ts
@src/lib/engine/__tests__/domain-modules.test.ts
@src/lib/types/proposal-outputs.ts
@src/lib/types/proposal-inputs.ts
@src/test-data/paul-friesen.ts
@src/test-data/paul-friesen-config.ts
@src/app/proposal/pages/CarbonCreditsPage.tsx
</context>

<interfaces>
<!-- Current function signature (being replaced) -->
```typescript
// src/lib/engine/carbon-credits.ts — CURRENT
export function computeCarbonCredits(
  annualProductionKwh: Decimal,
  config: AlbertaConfig,
): CarbonCreditProjection
```

<!-- New function signature -->
```typescript
// src/lib/engine/carbon-credits.ts — NEW
export function computeCarbonCredits(
  annualProductionKwh: Decimal,
  systemSizeKw: Decimal,
): CarbonCreditProjection
```

<!-- CarbonCreditProjection shape (unchanged — no type changes needed) -->
```typescript
export interface CarbonCreditProjection {
  annualCo2Avoided: Decimal;      // Uses Year 1 (2026) GDF as representative value
  tenYearPayoutLow: Decimal;      // Sum of owner revenue at $57/tonne over 10 years
  tenYearPayoutHigh: Decimal;     // Sum of owner revenue at $76/tonne over 10 years
  benchmarkSchedule: Array<{
    year: number;                 // Calendar year (2026, 2027, ...)
    pricePerTonne: Decimal;       // e.g., d('57') for low or shown as range
    payoutLow: Decimal;           // price × (1 - platformFee) — per-tonne owner revenue
    payoutHigh: Decimal;          // price_high × (1 - platformFee)
  }>;
}
```

<!-- AlbertaConfig (no longer needed by carbon-credits.ts) -->

<!-- Engine call site -->
```typescript
// src/lib/engine/calculate.ts line 71
const carbonCredits = computeCarbonCredits(inputs.system.annualProductionKwh, config);
// becomes:
const carbonCredits = computeCarbonCredits(
  inputs.system.annualProductionKwh,
  inputs.system.systemSizeKw,
);
```

<!-- Test fixture (paul-friesen.ts) -->
```typescript
system: {
  systemSizeKw: d('12.24'),           // Falls in 5–30 kWp tier → 30% platform fee
  annualProductionKwh: d('15408'),
}
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Replace computeCarbonCredits with SolarOffset.ca GDF logic</name>
  <files>src/lib/engine/carbon-credits.ts, src/lib/engine/__tests__/domain-modules.test.ts</files>
  <behavior>
    - Platform fee for systemSizeKw 12.24 kWp (5-30 range) = 30% → ownerKeep = 70%
    - Year 2026: gdf=0.4588, annualCo2 = 15408/1000 × 0.4588 = 7.0731504 tonnes
    - Year 2026 owner revenue low = 7.0731504 × 57 × 0.70 = $282.01 (approx)
    - Year 2026 owner revenue high = 7.0731504 × 76 × 0.70 = $376.29 (approx)
    - tenYearPayoutLow = sum of all 10 year owner revenues at $57/tonne
    - tenYearPayoutHigh = sum of all 10 year owner revenues at $76/tonne
    - annualCo2Avoided = 15408/1000 × 0.4588 (Year 1 GDF, representative display)
    - benchmarkSchedule has 10 entries (years 2026-2035)
    - payoutLow per entry = price_low × (1 - platformFee) per tonne (not multiplied by CO2)
    - payoutHigh per entry = price_high × (1 - platformFee) per tonne
  </behavior>
  <action>
    Rewrite src/lib/engine/carbon-credits.ts with the following structure:

    1. Remove AlbertaConfig import. Import is now: `import { d } from '@/lib/decimal'; import type Decimal from 'decimal.js'; import type { CarbonCreditProjection } from '@/lib/types/proposal-outputs';`

    2. Hardcode the GDF schedule as a module-level constant:
    ```typescript
    const SOLAROFFSET_SCHEDULE = [
      { year: 2026, gdf: '0.4588' },
      { year: 2027, gdf: '0.4271' },
      { year: 2028, gdf: '0.3952' },
      { year: 2029, gdf: '0.3633' },
      { year: 2030, gdf: '0.3108' },
      { year: 2031, gdf: '0.3046' },
      { year: 2032, gdf: '0.2985' },
      { year: 2033, gdf: '0.2925' },
      { year: 2034, gdf: '0.2867' },
      { year: 2035, gdf: '0.2752' },
    ] as const;

    const PRICE_LOW = d('57');   // $/tonne
    const PRICE_HIGH = d('76');  // $/tonne
    ```

    3. Platform fee helper function:
    ```typescript
    function platformFee(systemSizeKw: Decimal): Decimal {
      const kw = systemSizeKw.toNumber();
      if (kw >= 30) return d('0.25');
      if (kw >= 5)  return d('0.30');
      return d('0.45'); // 3–5 kWp
    }
    ```

    4. New computeCarbonCredits signature: `(annualProductionKwh: Decimal, systemSizeKw: Decimal): CarbonCreditProjection`

    5. Calculation logic:
    - `const fee = platformFee(systemSizeKw);`
    - `const ownerKeep = d('1').minus(fee);`
    - `const ownerPriceLow = PRICE_LOW.times(ownerKeep);`   // per-tonne owner revenue low
    - `const ownerPriceHigh = PRICE_HIGH.times(ownerKeep);` // per-tonne owner revenue high
    - `const annualMwh = annualProductionKwh.dividedBy(d('1000'));`
    - `const annualCo2Avoided = annualMwh.times(d(SOLAROFFSET_SCHEDULE[0].gdf));` // Year 1 GDF for display
    - For each entry in SOLAROFFSET_SCHEDULE:
      - `const yearCo2 = annualMwh.times(d(entry.gdf));`
      - `yearRevenueLow = yearCo2.times(PRICE_LOW).times(ownerKeep)`
      - `yearRevenueHigh = yearCo2.times(PRICE_HIGH).times(ownerKeep)`
    - `tenYearPayoutLow` = sum of yearRevenueLow over all 10 entries
    - `tenYearPayoutHigh` = sum of yearRevenueHigh over all 10 entries
    - benchmarkSchedule entries: `{ year: entry.year, pricePerTonne: PRICE_LOW, payoutLow: ownerPriceLow, payoutHigh: ownerPriceHigh }`
      - NOTE: pricePerTonne shows $57 (the low price), payoutLow/payoutHigh are per-tonne owner rates. The CarbonCreditsPage.tsx payoutRange() multiplies these by co2Float, so this is correct.
      - All 10 rows show same price/payout rates (prices don't change year-to-year, only GDF changes)

    Update domain-modules.test.ts CALC-05 section:
    - Change call from `computeCarbonCredits(annualProductionKwh, paulFriesenConfig)` to `computeCarbonCredits(annualProductionKwh, paulFriesenInputs.system.systemSizeKw)`
    - Update `annualCo2Avoided` assertion: 15408/1000 × 0.4588 = 7.0731504 → `cc.annualCo2Avoided.toFixed(7)).toBe('7.0731504')`
    - Keep `tenYearPayoutLow greaterThan 0` test
    - Keep `tenYearPayoutHigh > tenYearPayoutLow` test
    - Add test: `benchmarkSchedule has 10 entries` → `expect(cc.benchmarkSchedule).toHaveLength(10)`
    - Add test: `benchmarkSchedule[0].year === 2026`
  </action>
  <verify>
    <automated>cd "D:\Cursor\Solar Presenter" && npx vitest run src/lib/engine/__tests__/domain-modules.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>All CALC-05 tests pass with new GDF-based logic. No TypeScript errors in carbon-credits.ts.</done>
</task>

<task type="auto">
  <name>Task 2: Wire updated engine call site and fix UI footnote</name>
  <files>src/lib/engine/calculate.ts, src/app/proposal/pages/CarbonCreditsPage.tsx</files>
  <action>
    1. In src/lib/engine/calculate.ts:
       - Find line: `const carbonCredits = computeCarbonCredits(inputs.system.annualProductionKwh, config);`
       - Replace with: `const carbonCredits = computeCarbonCredits(inputs.system.annualProductionKwh, inputs.system.systemSizeKw);`
       - The `config` param is no longer passed to computeCarbonCredits. If config is still used elsewhere in calculate.ts (cashBackRate, gridEmissionFactor for other calculations) leave those usages intact — only remove from the computeCarbonCredits call.
       - Remove the AlbertaConfig import from carbon-credits.ts if it was previously imported there (it was — already handled in Task 1). No changes needed to calculate.ts imports.

    2. In src/app/proposal/pages/CarbonCreditsPage.tsx:
       - Find the footnote text: `{productionDisplay} kWh × 0.55 t/MWh Alberta grid factor`
       - Replace with: `{productionDisplay} kWh production · SolarOffset.ca GDF schedule (2026–2035)`
       - This is the only UI change needed. The table and numbers all flow from the updated engine output.

    Verify no TypeScript compile errors:
    Run `npx tsc --noEmit` from the project root.
  </action>
  <verify>
    <automated>cd "D:\Cursor\Solar Presenter" && npx tsc --noEmit 2>&1 | head -30 && npx vitest run 2>&1 | tail -15</automated>
  </verify>
  <done>
    - No TypeScript errors
    - All tests pass
    - calculate.ts passes systemSizeKw (not config) to computeCarbonCredits
    - CarbonCreditsPage footnote references SolarOffset.ca GDF schedule
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `npx vitest run` — all tests green
2. `npx tsc --noEmit` — no type errors
3. Spot-check in browser: visit /proposal?d=... with Paul Friesen data. CarbonCreditsPage should show annualCo2Avoided ~7.07 tonnes (not 8.47 as before), 10-year payout range will reflect new GDF/price logic.
</verification>

<success_criteria>
- computeCarbonCredits uses SolarOffset.ca GDF schedule (2026-2035) with declining per-year factors
- Platform fee correctly tiered: 12.24 kWp → 30% fee → 70% to owner
- tenYearPayoutLow and tenYearPayoutHigh computed by summing per-year CO2 × price × ownerKeep
- benchmarkSchedule has 10 entries with calendar years 2026-2035
- All existing tests pass (updated assertions for new CO2 values)
- No TypeScript compile errors
</success_criteria>

<output>
After completion, create `.planning/quick/15-update-carbon-credits-via-solar-offset-c/15-SUMMARY.md`
</output>
