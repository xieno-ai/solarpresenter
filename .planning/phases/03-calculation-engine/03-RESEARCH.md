# Phase 3: Calculation Engine - Research

**Researched:** 2026-03-02
**Domain:** Pure financial calculation functions in TypeScript using Decimal.js
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Function Signature & Config Coupling**
- `calculateProposal(inputs: ProposalInputs, config: AlbertaConfig): ProposalOutputs` — pure synchronous function
- AlbertaConfig is passed as a second parameter; the caller (server action or server component) is responsible for fetching it via `getAlbertaConfig()`
- This keeps the engine fully testable without Supabase — tests pass a static AlbertaConfig fixture, no async setup
- The existing stub signature `(inputs: ProposalInputs): ProposalOutputs` is updated to `(inputs, config)` — a breaking change but no callers exist yet

**Generate Button Wiring**
- Phase 3 upgrades the `/enter` Generate button to call a new server action (`calculateProposal` invocation via server action)
- Server action: fetches `getAlbertaConfig()`, converts form string values to Decimal, calls `calculateProposal(inputs, config)`, returns serialized `ProposalOutputs`
- Result displayed as a formatted JSON dump or structured summary on the `/enter` page — proves correctness visually before Phase 4 builds the full renderer
- No new routes — same `/enter` page shows results inline below the form

**Test Verification Strategy**
- Exact value matching against reference values from the calculations document (Paul Friesen case)
- Every sub-calculation gets its own test: utility projection, net metering per month, carbon credits, cash back, savings summaries
- Tests use the `paulFriesenInputs` fixture from `src/test-data/paul-friesen.ts`
- A static `paulFriesenConfig` fixture (AlbertaConfig-shaped object with known values) is created in test-data — no Supabase in tests
- Expected output values are baked into test expectations from the calculations doc reference spreadsheet

**Edge Case Policy**
- Surplus months (production >= consumption): gridBuyKwh = 0, surplusSoldKwh = production − consumption. No clamping errors — this is expected summer behavior.
- Zero-production months: all surplus fields = 0, gridBuyKwh = full consumption. Handled naturally by the math.
- Negative computed values (e.g., net savings negative due to high system cost): allowed — callers display as-is. No clamping to 0.

**Module Structure**
- Claude's discretion on internal file organization within `src/lib/engine/`
- Sub-calculations may be extracted as named helper functions in the same file or split by domain (utility-projection.ts, net-metering.ts, etc.) — planner decides
- All exports go through `src/lib/engine/calculate.ts` as the public API

### Claude's Discretion
- Internal file structure within `src/lib/engine/`
- How to serialize/deserialize ProposalOutputs through the server action (Decimal → string for JSON transport)
- Exact display format of ProposalOutputs on the /enter page (JSON dump is fine)
- Intermediate rounding decisions where the calculations doc is ambiguous

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CALC-01 | Utility cost projections for 20 and 30 years using 5% annual rate increase (geometric series formula) | Geometric series formula section; Decimal.js `.pow()` method |
| CALC-02 | Monthly net metering analysis — grid buy and surplus sold for each of 12 months based on production vs consumption | Net metering per-month logic section; edge case policy locked |
| CALC-03 | Annual grid purchase cost and annual sell revenue from net metering rates | Summing monthly costToBuy and revenueEarned arrays |
| CALC-04 | 20-year and 30-year net metering projections with 5% annual increase | Annual net metering totals scaled by geometric factor per year |
| CALC-05 | Carbon credit calculations — annual CO₂ avoided (Alberta grid factor 0.55 t/MWh), 10-year payout estimates using Alberta benchmark schedule (45-65% range) | Carbon credit formula section; AlbertaConfig.carbonBenchmarkSchedule |
| CALC-06 | Cash-back calculation — 3% on all grid electricity purchases over 20 and 30 years | Cash-back formula section; AlbertaConfig.cashBackRate |
| CALC-07 | True all-in savings (cash purchase) — utility avoided + net metering revenue + carbon credits + cash back − system cost | SavingsSummary interface maps directly to this |
| CALC-08 | Monthly finance analysis — finance payment + remaining utility − net metering revenue − carbon credits − cash back = monthly all-in cost | financeOption.monthlyAllInCost in ProposalOutputs |
</phase_requirements>

---

## Summary

Phase 3 is a pure computation layer: implement all financial formulas that transform `ProposalInputs + AlbertaConfig → ProposalOutputs`. No UI components are built except wiring the existing Generate button to a new server action. The calculation domain is straightforward (arithmetic + geometric series), and the primary risk is formula correctness rather than library API complexity.

The entire stack is already in place from Phases 1 and 2. `Decimal.js` is installed at v10.6.0, configured with 20-digit precision and ROUND_HALF_UP, wrapped in `d()` from `src/lib/decimal/index.ts`. `ProposalOutputs` is fully typed. `paulFriesenInputs` fixture exists. Vitest is configured with `vitest.config.ts` and runs via `npm test`. What's missing is (1) the calculation implementation, (2) a `paulFriesenConfig` test fixture, and (3) the server action that wires it to the form.

The calculation formulas from the CONTEXT.md are unambiguous: geometric series for utility projections, month-by-month comparison for net metering, CO₂ tonnes × benchmark price × payout percentage for carbon credits, and aggregated sums for savings summaries. The reference spreadsheet (Paul Friesen case) provides exact expected output values — tests assert `.eq()` on Decimal values or string `.toFixed()` representations.

**Primary recommendation:** Implement in domain-split files under `src/lib/engine/`, with `calculate.ts` as the single public-API entry point, and write test assertions using Vitest's `expect(result.toFixed(2)).toBe('expected')` pattern against known Paul Friesen reference values.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| decimal.js | 10.6.0 | All monetary and energy arithmetic | Already installed Phase 1; IEEE 754 precision; 20 sig digits |
| vitest | 3.2.4 | Unit test framework | Already configured; native ESM + TypeScript; no Babel |
| TypeScript | 5.9.3 | Type safety for ProposalInputs/Outputs | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next.js (server actions) | 16.1.6 | Wire calculateProposal to the form | Existing `get-defaults.ts` pattern to follow |
| `@/lib/decimal` | local | d(), toFixed(), toJSON(), fromJSON() helpers | Every calculation file — never raw Decimal arithmetic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Decimal.js | Native JS Math | Native Math has IEEE 754 errors in 30-year compounding; project locked on Decimal.js |
| Per-year loops | Reduce/functional | Both valid; loops are more readable for reviewers verifying against spreadsheet |

**Installation:** Nothing new to install. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/engine/
├── calculate.ts           # Public API: calculateProposal() — imports and calls sub-modules
├── utility-projection.ts  # CALC-01: geometric series, 20/30-year arrays
├── net-metering.ts        # CALC-02, CALC-03, CALC-04: monthly analysis + annual totals + projections
├── carbon-credits.ts      # CALC-05: CO2 avoided, benchmark schedule, payout range
├── cash-back.ts           # CALC-06: 3% on grid purchases
└── savings.ts             # CALC-07, CALC-08: SavingsSummary + finance analysis

src/test-data/
├── paul-friesen.ts        # Exists: ProposalInputs fixture
└── paul-friesen-config.ts # NEW: AlbertaConfig fixture (no Supabase)

src/lib/engine/__tests__/
└── calculate.test.ts      # All engine unit tests (or per-domain files)

src/app/actions/
└── calculate.ts           # NEW: server action wrapping calculateProposal
```

### Pattern 1: Pure Sub-Calculation Functions
**What:** Each domain (utility projection, net metering, etc.) lives in its own file and exports one or more named functions. `calculate.ts` assembles them.
**When to use:** Always — keeps files testable in isolation and reviewable against spreadsheet sections.

```typescript
// src/lib/engine/utility-projection.ts
import { d } from '@/lib/decimal';
import type Decimal from 'decimal.js';

/** Returns array of yearly utility costs: index 0 = Year 1, index N-1 = Year N */
export function projectUtilityCosts(
  annualCost: Decimal,
  escalationRate: Decimal,
  years: number,
): Decimal[] {
  const result: Decimal[] = [];
  for (let n = 1; n <= years; n++) {
    // Year N cost = Year 0 cost × (1 + escalationRate)^N
    result.push(annualCost.times(d('1').plus(escalationRate).pow(n)));
  }
  return result;
}
```

### Pattern 2: Net Metering Month-by-Month
**What:** Iterate all 12 months, compare production vs consumption, classify as buy or surplus.
**When to use:** CALC-02, CALC-03 implementations.

```typescript
// src/lib/engine/net-metering.ts
import { d } from '@/lib/decimal';
import type { MonthlyNetMetering } from '@/lib/types/proposal-outputs';
import type { ProposalInputs } from '@/lib/types/proposal-inputs';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function computeMonthlyNetMetering(inputs: ProposalInputs): MonthlyNetMetering[] {
  return inputs.system.monthlyProductionKwh.map((production, i) => {
    const consumption = inputs.consumption.monthlyConsumptionKwh[i];
    const diff = production.minus(consumption);
    const surplus = diff.gt(0);
    const gridBuyKwh = surplus ? d('0') : diff.neg();
    const surplusSoldKwh = surplus ? diff : d('0');
    return {
      month: MONTH_NAMES[i],
      consumptionKwh: consumption,
      productionKwh: production,
      gridBuyKwh,
      surplusSoldKwh,
      costToBuy: gridBuyKwh.times(inputs.rates.netMeteringBuyRate),
      revenueEarned: surplusSoldKwh.times(inputs.rates.netMeteringSellRate),
    };
  });
}
```

### Pattern 3: Test Fixture for AlbertaConfig
**What:** Static `paulFriesenConfig` object in `src/test-data/paul-friesen-config.ts` mirrors the AlbertaConfig shape with known values, no Supabase needed.
**When to use:** All engine unit tests.

```typescript
// src/test-data/paul-friesen-config.ts
import { d } from '@/lib/decimal';
import type { AlbertaConfig } from '@/lib/types';

export const paulFriesenConfig: AlbertaConfig = {
  id: 'test-config',
  effectiveFrom: '2024-01-01',
  effectiveTo: null,
  gridEmissionFactor: d('0.55'),      // t CO2/MWh
  payoutPercentageLow: d('0.45'),
  payoutPercentageHigh: d('0.65'),
  cashBackRate: d('0.03'),
  defaultEscalationRate: d('0.05'),
  defaultNetMeteringBuyRate: d('0.168'),
  defaultNetMeteringSellRate: d('0.335'),
  carbonBenchmarkSchedule: [
    // Alberta benchmark prices — supply from calculations doc
    // year 1..10 with pricePerTonne, payoutLow, payoutHigh
  ],
};
```

### Pattern 4: Vitest Decimal Assertions
**What:** Compare Decimal results using `.toFixed(N)` string form or `.eq()` method. Both approaches verified to work with Vitest `expect`.
**When to use:** All engine tests — prefer `.toFixed(2)` for money, `.toFixed(4)` for rates/factors.

```typescript
// src/lib/engine/__tests__/calculate.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProposal } from '../calculate';
import { paulFriesenInputs } from '@/test-data/paul-friesen';
import { paulFriesenConfig } from '@/test-data/paul-friesen-config';

describe('calculateProposal — Paul Friesen reference case', () => {
  const outputs = calculateProposal(paulFriesenInputs, paulFriesenConfig);

  it('CALC-01: 20-year utility cost projection has 20 entries', () => {
    expect(outputs.utilityProjection20Year).toHaveLength(20);
  });

  it('CALC-01: Year 1 utility cost = annualCost × 1.05^1', () => {
    // $4212 × 1.05 = $4422.60
    expect(outputs.utilityProjection20Year[0].toFixed(2)).toBe('4422.60');
  });

  it('CALC-02: January net metering — grid buy (production < consumption)', () => {
    // Jan: production 648, consumption 1100 → gridBuyKwh = 452
    const jan = outputs.monthlyNetMetering[0];
    expect(jan.gridBuyKwh.toFixed(0)).toBe('452');
    expect(jan.surplusSoldKwh.toFixed(0)).toBe('0');
  });

  it('CALC-05: Annual CO2 avoided = (15408 / 1000) × 0.55', () => {
    // 15.408 × 0.55 = 8.4744
    expect(outputs.carbonCredits.annualCo2Avoided.toFixed(4)).toBe('8.4744');
  });
});
```

### Pattern 5: Server Action for Calculate
**What:** `src/app/actions/calculate.ts` follows the exact pattern of `get-defaults.ts`. Fetches config, accepts serialized form values, converts to Decimal, calls `calculateProposal`, serializes outputs back to strings.
**When to use:** When wiring the Generate button in Phase 3.

```typescript
// src/app/actions/calculate.ts
'use server';

import { getAlbertaConfig } from '@/lib/config/alberta';
import { calculateProposal } from '@/lib/engine/calculate';
import { d, toJSON } from '@/lib/decimal';
import type { ProposalInputs, MonthlyValues } from '@/lib/types';

// Accept ProposalFormValues (all strings) — server action receives serialized form data
export async function runCalculation(formValues: SerializedFormValues): Promise<SerializedOutputs> {
  const config = await getAlbertaConfig();
  const inputs: ProposalInputs = {
    // ... convert string fields to Decimal via d()
  };
  const outputs = calculateProposal(inputs, config);
  // Serialize: all Decimal fields become strings via toJSON()
  return serializeOutputs(outputs);
}
```

### Pattern 6: Decimal Serialization for Server Action Boundary
**What:** Next.js server actions cannot pass Decimal instances through the server/client boundary. All Decimal fields must be converted to strings via `toJSON()` before return, and re-parsed with `fromJSON()` on the client side.
**When to use:** The calculate server action response type.

```typescript
// Serialization pattern — convert ProposalOutputs to all-string form
function serializeDecimal(val: Decimal): string {
  return val.toString();
}
// Arrays of Decimal
function serializeDecimalArray(arr: Decimal[]): string[] {
  return arr.map(serializeDecimal);
}
```

### Anti-Patterns to Avoid
- **Float arithmetic on form strings:** Never `Number(str) * Number(str2)`. Always `d(str).times(d(str2))`.
- **Calling pow() with JS number exponent on intermediate results:** Use `d('1').plus(rate).pow(n)` — the exponent `n` (integer loop index) is safe as a JS number argument to `.pow()`.
- **Mutating the paulFriesenInputs fixture:** Tests should treat it as read-only; never `.set()` on it.
- **Rounding intermediate values:** Only round at display time (`.toFixed()`) or when the spreadsheet explicitly specifies an intermediate rounding step. Round at the final output stage, not mid-calculation.
- **Storing year-0 in the projection arrays:** `utilityProjection20Year` is 20 elements (Year 1 through Year 20), index 0 = Year 1. Match the spreadsheet convention.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Precise decimal arithmetic | Custom rounding/truncation logic | `d()` + Decimal.js `.times()`, `.pow()` | Accumulation errors in 30-year compounding with JS floats |
| Carbon benchmark schedule | Hardcoded price table | `config.carbonBenchmarkSchedule` from Supabase via AlbertaConfig | Config values belong in DB, not code |
| Decimal JSON serialization | Custom `JSON.stringify` replacer | `toJSON()` / `fromJSON()` from `@/lib/decimal` | Already built, handles precision correctly |
| Test fixture construction | Inline object literals in each test | `paulFriesenInputs` + `paulFriesenConfig` fixtures | Single source of truth; 12-month arrays error-prone to repeat |

**Key insight:** The calculations themselves are simple arithmetic — the complexity is purely precision. Don't introduce any library beyond Decimal.js. Summation loops, geometric series, and conditional branching are all native TypeScript.

---

## Common Pitfalls

### Pitfall 1: Calculating solarOffsetPercent Incorrectly
**What goes wrong:** `solarOffsetPercent` = annual production / annual consumption as a percentage. Easy to invert (consumption/production) or forget to multiply by 100.
**Why it happens:** Both numerator and denominator are "annual kWh" — easy to swap.
**How to avoid:** `solarOffsetPercent = annualProductionKwh.dividedBy(annualConsumptionKwh).times(d('100'))`. For Paul Friesen: 15408 / 12000 × 100 = 128.4% (system overproduces).
**Warning signs:** Value over 200 or under 0 indicates inversion.

### Pitfall 2: 20-Year vs 30-Year Projection Array Lengths
**What goes wrong:** `utilityProjection20Year` has 20 elements, `utilityProjection30Year` has 30 elements. Off-by-one errors (e.g., range 0..19 vs 1..20) produce a year-0 or year-21 entry.
**Why it happens:** Loop boundary confusion.
**How to avoid:** `for (let n = 1; n <= years; n++)` — start at 1, push to result. TypeScript type `Decimal[]` doesn't enforce length, so the test `expect(arr).toHaveLength(20)` is essential.
**Warning signs:** Sum of 20-year projection doesn't match expected 20-year utility cost.

### Pitfall 3: Carbon Credit Payout Range — 10 Years Only
**What goes wrong:** Summing all benchmark schedule entries (which may cover more than 10 years) instead of first 10 years. Or summing the wrong quantity.
**Why it happens:** `carbonBenchmarkSchedule` in AlbertaConfig is an array of arbitrary length.
**How to avoid:** Sum `annualCo2Avoided × pricePerTonne × payoutPercentageLow` for entries where `entry.year <= 10`. The `payoutLow` and `payoutHigh` fields in `CarbonBenchmarkEntry` are pre-computed (price × low%, price × high%) — multiply by annualCo2Avoided, not price again.
**Warning signs:** `tenYearPayoutLow` outside the 45-65% of raw credit value range.

### Pitfall 4: Net Metering Annual Projections (CALC-04) vs Base Year (CALC-03)
**What goes wrong:** CALC-03 is the base-year annual totals. CALC-04 projects those totals forward with 5% escalation for 20 and 30 years. These are separate outputs. Mixing them produces wrong 20-year savings.
**Why it happens:** The `annualGridPurchaseCost` and `annualSellRevenue` fields in `ProposalOutputs` are CALC-03 (Year 0 values). The 20/30-year savings in `SavingsSummary.netMeteringRevenue` require summation of all projected years.
**How to avoid:** Compute base-year values first, then use the same geometric escalation used for utility projections. For net metering revenue: sum of `annualSellRevenue × (1 + escalationRate)^n` for n=1..20.
**Warning signs:** netMeteringRevenue in SavingsSummary matches annualSellRevenue × 20 (flat), which is too low.

### Pitfall 5: Server Action Decimal Serialization
**What goes wrong:** Next.js server actions serialize return values to JSON. Decimal instances are objects with internal `s`, `e`, `c` properties — they serialize as objects, not as readable strings.
**Why it happens:** Decimal is a class instance, not a JSON primitive.
**How to avoid:** The server action must convert all Decimal fields to strings using `toJSON()` before returning. Define a `SerializedProposalOutputs` type mirroring `ProposalOutputs` but with `string` instead of `Decimal`. The `/enter` page currently uses a custom JSON.stringify replacer that checks for `s`, `e`, `c` properties — this can be reused or the action can return pre-serialized strings.
**Warning signs:** Client receives `{}` or `[Object object]` for Decimal values in server action response.

### Pitfall 6: Intermediate Rounding Breaking Spreadsheet Match
**What goes wrong:** Rounding intermediate results (e.g., monthly gridBuyKwh to 2dp) then using those rounded values in further calculations causes divergence from the reference spreadsheet.
**Why it happens:** Spreadsheets also accumulate intermediate values — but usually at full precision.
**How to avoid:** Carry full Decimal precision throughout all intermediate calculations. Only apply `toFixed()` at display time or in test assertions. If a test fails by 1 cent, remove intermediate `toFixed()` calls.
**Warning signs:** Single-value tests pass but accumulated 20-year sum is off by $0.50+.

---

## Code Examples

Verified patterns from official sources and existing project code:

### Geometric Series (Utility Projection)
```typescript
// Decimal.js official API: https://mikemcl.github.io/decimal.js/
// d('1').plus(escalationRate).pow(n) — integer n is safe as JS number
import { d } from '@/lib/decimal';

function projectUtilityCosts(annualCost: Decimal, escalationRate: Decimal, years: number): Decimal[] {
  return Array.from({ length: years }, (_, i) => {
    const n = i + 1; // Year 1 through Year N
    return annualCost.times(d('1').plus(escalationRate).pow(n));
  });
}
// Paul Friesen Year 1: d('4212').times(d('1').plus(d('0.05')).pow(1)) = 4422.60
// Paul Friesen Year 20: d('4212').times(d('1.05').pow(20)) = 11178.07 (approx)
```

### Net Metering Month Logic
```typescript
// Locked decision from CONTEXT.md
const surplus = production.greaterThanOrEqualTo(consumption);
const gridBuyKwh = surplus ? d('0') : consumption.minus(production);
const surplusSoldKwh = surplus ? production.minus(consumption) : d('0');
const costToBuy = gridBuyKwh.times(netMeteringBuyRate);
const revenueEarned = surplusSoldKwh.times(netMeteringSellRate);
```

### Carbon Credits CO2 Calculation
```typescript
// annualCo2Avoided = (annualProductionKwh / 1000) × gridEmissionFactor
const annualCo2Avoided = annualProductionKwh
  .dividedBy(d('1000'))
  .times(config.gridEmissionFactor);
// Paul Friesen: d('15408').dividedBy('1000').times('0.55') = 8.4744 tonnes

// 10-year payout (low end)
const tenYearPayoutLow = config.carbonBenchmarkSchedule
  .filter(entry => entry.year <= 10)
  .reduce((sum, entry) => sum.plus(annualCo2Avoided.times(entry.payoutLow)), d('0'));
```

### Cash Back Calculation
```typescript
// 3% on all grid purchases over N years — grid purchases also escalate annually
// Sum for year n = annualGridPurchaseCost × (1 + escalationRate)^n × cashBackRate
function computeCashBack(
  annualGridPurchaseCost: Decimal,
  escalationRate: Decimal,
  cashBackRate: Decimal,
  years: number,
): Decimal {
  let total = d('0');
  for (let n = 1; n <= years; n++) {
    const yearCost = annualGridPurchaseCost.times(d('1').plus(escalationRate).pow(n));
    total = total.plus(yearCost.times(cashBackRate));
  }
  return total;
}
```

### Savings Summary (Cash Purchase)
```typescript
// SavingsSummary fields map directly to ProposalOutputs.cashPurchase.twentyYear
const twentyYearUtilityAvoided = projectedUtilityCosts20Year.reduce(
  (sum, cost) => sum.plus(cost), d('0')
);
// netSavingsAfterCost = totalSavings − cashPurchasePrice
const totalSavings = utilityAvoided.plus(netMeteringRevenue).plus(carbonCredits).plus(cashBack);
const netSavingsAfterCost = totalSavings.minus(cashPurchasePrice);
```

### Finance Analysis (CALC-08)
```typescript
// monthlyAllInCost = financeMonthlyPayment + remainingMonthlyCost − monthlyNetMeteringRevenue − monthlyCarbonCredits − monthlyCashBack
// Note: "remaining utility" = what you still pay grid after solar (annualGridPurchaseCost / 12)
const monthlyGridCost = annualGridPurchaseCost.dividedBy(d('12'));
const monthlyNetMeteringRev = annualSellRevenue.dividedBy(d('12'));
const monthlyCarbonCredit = annualCarbonCreditRevenue.dividedBy(d('12'));
const monthlyCashBack = annualCashBack20Year.dividedBy(d('240')); // over 20-year term
const monthlyAllInCost = financeMonthlyPayment
  .plus(monthlyGridCost)
  .minus(monthlyNetMeteringRev)
  .minus(monthlyCarbonCredit)
  .minus(monthlyCashBack);
```

### Decimal Serialization for Server Action Boundary
```typescript
// Pattern for converting ProposalOutputs to JSON-safe strings
// Follows existing replacer pattern in /enter page.tsx
function decimalReplacer(_key: string, val: unknown): unknown {
  if (val && typeof val === 'object' && 's' in val && 'e' in val && 'c' in val) {
    return (val as { toString(): string }).toString();
  }
  return val;
}
const serialized = JSON.stringify(outputs, decimalReplacer);
```

### Vitest Test Structure for Engine
```typescript
// src/lib/engine/__tests__/calculate.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProposal } from '../calculate';
import { paulFriesenInputs } from '@/test-data/paul-friesen';
import { paulFriesenConfig } from '@/test-data/paul-friesen-config';

describe('calculateProposal', () => {
  // Compute once — pure function, deterministic
  const outputs = calculateProposal(paulFriesenInputs, paulFriesenConfig);

  describe('CALC-01 utility projection', () => {
    it('has 20 entries in 20-year array', () => {
      expect(outputs.utilityProjection20Year).toHaveLength(20);
    });
    it('has 30 entries in 30-year array', () => {
      expect(outputs.utilityProjection30Year).toHaveLength(30);
    });
    it('Year 1 cost = $4212 × 1.05 = $4422.60', () => {
      expect(outputs.utilityProjection20Year[0].toFixed(2)).toBe('4422.60');
    });
  });

  describe('CALC-02 monthly net metering', () => {
    it('January: grid buy = 452 kWh (consumption 1100 - production 648)', () => {
      expect(outputs.monthlyNetMetering[0].gridBuyKwh.toFixed(0)).toBe('452');
    });
    it('June: surplus sold = 914 kWh (production 1764 - consumption 850)', () => {
      expect(outputs.monthlyNetMetering[5].surplusSoldKwh.toFixed(0)).toBe('914');
    });
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest for TypeScript | Vitest 3.x | 2023+ | Native ESM, no Babel, faster; project already on Vitest |
| `new Decimal(floatValue)` | `d('stringValue')` | Project convention (Phase 1) | Eliminates float precision errors at construction |
| Hardcoded regulatory constants | AlbertaConfig from Supabase | Phase 1 decision | Config changes don't require code deploys |

**Deprecated/outdated:**
- Jest: project chose Vitest in Phase 1 (02-01 decision) — do not introduce Jest
- Raw `Decimal` constructor without wrapper: use `d()` helper always
- `calculateProposal(inputs)` one-parameter signature: replaced by `calculateProposal(inputs, config)` in this phase

---

## Open Questions

1. **Carbon benchmark schedule values for the paulFriesenConfig fixture**
   - What we know: The Alberta benchmark schedule is stored in Supabase `carbon_benchmark_schedule` table. The AlbertaConfig fixture needs actual year/price values to produce testable outputs.
   - What's unclear: The exact prices per year are in the Word document (binary DOCX — couldn't be read). The CONTEXT.md states "10-year payout estimates using the Alberta benchmark schedule fall within the 45-65% range."
   - Recommendation: Wave 0 task — before writing assertion tests for CALC-05, retrieve the benchmark schedule from Supabase (or read the DOCX) and hardcode into `paulFriesenConfig` fixture. Alternatively, assert only that the payout is between 45% and 65% of the gross credit value rather than exact dollar values.

2. **CALC-08 monthly finance analysis — which year's rates apply?**
   - What we know: The formula from CONTEXT.md is `financePayment + remainingUtility − netMeteringRevenue − carbonCredits − cashBack = monthlyAllInCost`. The ProposalOutputs has `financeOption.monthlyAllInCost` (single Decimal, not per-year).
   - What's unclear: Does "remaining utility" use Year 1 escalated costs or Year 0 base costs? Does the monthly figure use base-year net metering or averaged over the term?
   - Recommendation: Use Year 0 / base-year figures for the monthly snapshot (no escalation applied). This is the "current year" comparison. Planner should verify against spreadsheet.

3. **twentyYearUtilityCost field on ProposalOutputs (Page 1)**
   - What we know: `ProposalOutputs.twentyYearUtilityCost` is the Page 1 cover value. It is likely the sum of all 20 years' projected costs.
   - What's unclear: Is it the sum of the escalated 20-year projection array, or the Year 20 value alone?
   - Recommendation: Assume sum of all 20 years (total utility spend) — that's the more impactful "you'll spend $X over 20 years" framing used on solar proposals.

4. **twentyYearSavings field on ProposalOutputs (Page 1)**
   - What we know: It's the cover page savings number. Likely `cashPurchase.twentyYear.netSavingsAfterCost`.
   - What's unclear: Does it include or exclude the system cost in the cover page figure?
   - Recommendation: Use `netSavingsAfterCost` (net of system cost) — this is the "net gain" figure used on cover pages.

---

## Sources

### Primary (HIGH confidence)
- `D:/Cursor/Solar Presenter/src/lib/types/proposal-outputs.ts` — ProposalOutputs interface, all fields typed
- `D:/Cursor/Solar Presenter/src/lib/types/alberta-config.ts` — AlbertaConfig interface with all regulatory fields
- `D:/Cursor/Solar Presenter/src/lib/decimal/index.ts` — d(), toFixed(), toJSON(), fromJSON() confirmed API
- `D:/Cursor/Solar Presenter/src/test-data/paul-friesen.ts` — All 12 production/consumption months confirmed
- `D:/Cursor/Solar Presenter/vitest.config.ts` — Vitest configured, node environment, `@` alias set
- `D:/Cursor/Solar Presenter/package.json` — decimal.js@10.6.0, vitest@3.2.4 confirmed installed
- Decimal.js official docs: https://mikemcl.github.io/decimal.js/ — `.pow()`, `.times()`, `.plus()`, `.dividedBy()` API confirmed
- `.planning/phases/03-calculation-engine/03-CONTEXT.md` — All formula decisions locked

### Secondary (MEDIUM confidence)
- Vitest official docs: https://vitest.dev/guide/ — `describe`/`it`/`expect` pattern confirmed current
- `D:/Cursor/Solar Presenter/src/lib/engine/calculate.ts` — Stub confirmed, signature to update

### Tertiary (LOW confidence)
- Exact carbon benchmark schedule dollar values — could not read DOCX (binary). Must retrieve from Supabase or the actual document before writing CALC-05 tests.
- CALC-08 exact monthly formula interpretation — spreadsheet not readable, formula reconstruction from CONTEXT.md description only.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries installed and confirmed; Decimal.js API verified against official docs
- Architecture: HIGH — ProposalOutputs fully typed, formula logic from CONTEXT.md is unambiguous
- Pitfalls: HIGH — based on direct code inspection and Decimal.js behavior patterns
- Formula values (Paul Friesen reference): MEDIUM — formulas clear, exact expected values require DOCX or Supabase

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable domain; Decimal.js and Vitest APIs don't change rapidly)
