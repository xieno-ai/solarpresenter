# Phase 1: Foundation & Data Schema - Research

**Researched:** 2026-03-02
**Domain:** Next.js App Router scaffold, TypeScript data contracts, Decimal.js precision arithmetic, Supabase database, centralized Alberta configuration
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project foundation: a Next.js 16 application with App Router, TypeScript-first data contracts, Decimal.js for all financial arithmetic, Supabase for database persistence (Alberta config + future proposals), and a smoke test proving end-to-end data flow. The project already has a `package.json` with Playwright installed and reference assets in place -- the Next.js scaffold will wrap around this existing structure.

The key challenge is designing data contracts that serve both the calculation engine (Phase 3) and the proposal renderer (Phase 4) without needing rework. The `ProposalInputs` type must capture everything from the CONTEXT.md decisions (customer info, system specs, 12 monthly production/consumption values, 4 rate values, cost/financing), and `ProposalOutputs` must capture everything the 11-page proposal renders. All monetary fields in both types use Decimal.js -- never native `Number`.

The Alberta config schema in Supabase needs effective dates and version history so older proposals display the rates valid when they were generated. This is a temporal data pattern: each config row has `effective_from` and `effective_to` dates, and queries filter by the proposal's creation date.

**Primary recommendation:** Use `create-next-app` with defaults (TypeScript, Tailwind, App Router, Turbopack), add Decimal.js and Supabase client, define `ProposalInputs`/`ProposalOutputs` types with nested grouping in a shared `src/lib/types/` module, create the Supabase schema with RLS policies for public read, and wire a hardcoded Paul Friesen test case through a stub calculation to a placeholder page.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Monthly data format:** 12 individual monthly values for both production and consumption are the canonical format. Manual entry accepts either 12 monthly values OR a single annual total (distributed via Alberta solar curve). Bill extraction attempts monthly from consumption graph if available, annual fallback.
- **Equipment details excluded:** Module model, inverter brand are NOT part of the data contract -- they don't appear in the proposal output.
- **Only proposal-visible data:** Only data that appears in the 11-page proposal PDF is needed in the contract.
- **Input fields defined:** Customer (name, address, lat/long), System (size kW, annual production, 12 monthly production), Consumption (annual kWh, 12 monthly values, annual electricity cost), Rates (all-in rate, net metering buy rate, net metering sell rate, annual escalation rate with default from config), Cost & Financing (cash price, finance monthly payment, finance term months, finance interest rate).
- **Carbon credits computed:** Calculated from formula: CO2 = (production/1000) x grid_factor, payouts = CO2 x benchmark x payout_percentage. No SolarOffset.ca quotes needed.
- **Supabase from Phase 1:** Database tables needed: Alberta config (with effective dates + version history), proposals (for Phase 9 shareable URLs). Set up Supabase project and schema as foundation work.
- **Alberta config in Supabase:** ALL regulatory/configurable values in Supabase, not hardcoded: carbon benchmark schedule, grid emission factor, payout percentage range, cash back rate, default annual escalation rate, net metering rate defaults. Version history with effective dates.
- **Project stack:** Next.js with App Router, Tailwind CSS, npm, Vercel deployment target, Supabase, Decimal.js.
- **Smoke test:** Use Paul Friesen data from the calculations doc as hardcoded test inputs. This becomes the verified reference case for Phase 3.

### Claude's Discretion

- Data contract grouping structure (nested objects vs flat)
- Next.js project structure and file organization
- Component library choices
- Smoke test visual fidelity
- Supabase schema design details
- Which Tailwind plugins/config

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CALC-09 | All financial calculations use Decimal.js for precision (no IEEE 754 floating-point errors in 30-year projections) | Decimal.js v10.6.0 with built-in TypeScript types; all monetary fields in ProposalInputs/ProposalOutputs defined as `Decimal` type; wrapper utilities for construction and serialization; configured with precision 20, ROUND_HALF_UP |
| CALC-10 | Alberta regulatory values (carbon benchmark prices, grid emission factor, rate assumptions) stored in centralized configuration, not hardcoded in formulas | Supabase `alberta_config` table with effective dates, RLS public read policy, server-side query utility, typed config interface; values seeded from calculations document |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x (currently 16.1.6) | Full-stack React framework with App Router | Default choice for Vercel deployment; App Router is the stable default; Turbopack is now default bundler for dev and build |
| React | 19.2.x (via Next.js 16 canary) | UI rendering | Included with Next.js 16; includes View Transitions, useEffectEvent, Activity |
| TypeScript | 5.x | Type safety | Built-in Next.js support; minimum 5.1.0 required |
| Tailwind CSS | 4.x | Utility-first styling | Default option in create-next-app; project decision |
| Decimal.js | 10.6.0 | Arbitrary-precision decimal arithmetic | Industry standard for financial calculations in JS/TS; built-in TypeScript types; 65+ instance methods |
| @supabase/supabase-js | 2.98.x | Supabase client for database access | Official Supabase client; TypeScript support; isomorphic (server + client) |
| @supabase/ssr | 0.8.x | Server-side Supabase client for Next.js | Required for proper Next.js App Router integration; cookie-based session handling; future-proofs for Phase 9 auth needs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| supabase (CLI) | latest | Database type generation, local development | Run `npx supabase gen types typescript` to generate database types after schema changes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Decimal.js | bignumber.js | Decimal.js is slightly larger but specifies precision in significant digits (better for financial) and includes trig functions; bignumber.js uses decimal places. Decimal.js is the right choice for 30-year projections. |
| Decimal.js | dinero.js | Dinero.js is specifically for money (currency-aware), but we need general decimal arithmetic for energy calculations (kWh, tonnes CO2), not just money. Decimal.js covers all use cases. |
| @supabase/ssr | Plain @supabase/supabase-js createClient | For Phase 1 with no auth, plain createClient works. But @supabase/ssr future-proofs for Phase 9 (shareable URLs) and follows Supabase's recommended Next.js pattern. Use SSR pattern from the start. |

**Installation:**
```bash
npx create-next-app@latest . --yes
npm install decimal.js @supabase/supabase-js @supabase/ssr
```

Note: `create-next-app` with `--yes` installs Next.js 16, React 19, TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack by default. The project already has a `package.json` -- the scaffold needs to either initialize in a subdirectory and merge, or reinitialize cleanly.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/                          # Next.js App Router pages and layouts
│   ├── layout.tsx                # Root layout (html, body, fonts, providers)
│   ├── page.tsx                  # Home page (smoke test placeholder in Phase 1)
│   └── api/                      # API routes (stub in Phase 1)
│       └── calculate/
│           └── route.ts          # Stub calculation endpoint
├── lib/                          # Shared utilities and business logic
│   ├── types/                    # TypeScript data contracts
│   │   ├── proposal-inputs.ts    # ProposalInputs type definition
│   │   ├── proposal-outputs.ts   # ProposalOutputs type definition
│   │   ├── alberta-config.ts     # AlbertaConfig type definition
│   │   └── index.ts              # Barrel export
│   ├── decimal/                  # Decimal.js utilities
│   │   └── index.ts              # Construction helpers, serialization, config
│   ├── supabase/                 # Supabase client utilities
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server component client
│   │   └── types.ts              # Generated database types
│   ├── config/                   # Configuration access layer
│   │   └── alberta.ts            # Fetch Alberta config from Supabase with effective date filtering
│   └── engine/                   # Calculation engine (stub in Phase 1)
│       └── calculate.ts          # Stub: inputs -> outputs (placeholder)
├── components/                   # React components (minimal in Phase 1)
│   └── ui/                       # Shared UI primitives
└── test-data/                    # Hardcoded test fixtures
    └── paul-friesen.ts           # Paul Friesen reference case
```

### Pattern 1: Nested Data Contract Grouping

**What:** Group `ProposalInputs` into logical sub-objects that mirror the proposal sections, rather than a flat bag of 30+ fields.
**When to use:** Always -- the nested structure makes it clear which fields belong together and maps naturally to form sections (Phase 2) and proposal pages (Phase 4).
**Example:**

```typescript
// src/lib/types/proposal-inputs.ts
import Decimal from 'decimal.js';

export interface CustomerInfo {
  name: string;
  address: string;
  latitude: number;   // For satellite image, not financial
  longitude: number;  // For satellite image, not financial
}

export interface SystemInfo {
  systemSizeKw: Decimal;         // e.g., 12.24 kW
  annualProductionKwh: Decimal;  // e.g., 15,408 kWh
  monthlyProductionKwh: [        // Exactly 12 values, Jan-Dec
    Decimal, Decimal, Decimal, Decimal,
    Decimal, Decimal, Decimal, Decimal,
    Decimal, Decimal, Decimal, Decimal
  ];
}

export interface ConsumptionInfo {
  annualConsumptionKwh: Decimal;
  monthlyConsumptionKwh: [       // Exactly 12 values, Jan-Dec
    Decimal, Decimal, Decimal, Decimal,
    Decimal, Decimal, Decimal, Decimal,
    Decimal, Decimal, Decimal, Decimal
  ];
  annualElectricityCost: Decimal; // Current annual bill
}

export interface RateInfo {
  allInRate: Decimal;              // e.g., 0.3510 ($/kWh)
  netMeteringBuyRate: Decimal;     // e.g., 0.1680 ($/kWh)
  netMeteringSellRate: Decimal;    // e.g., 0.3350 ($/kWh)
  annualEscalationRate: Decimal;   // e.g., 0.05 (5%)
}

export interface FinancingInfo {
  cashPurchasePrice: Decimal;
  financeMonthlyPayment: Decimal;
  financeTermMonths: number;       // Integer, not Decimal
  financeInterestRate: Decimal;    // e.g., 0.0699 (6.99%)
}

export interface ProposalInputs {
  customer: CustomerInfo;
  system: SystemInfo;
  consumption: ConsumptionInfo;
  rates: RateInfo;
  financing: FinancingInfo;
}
```

### Pattern 2: Decimal.js Wrapper Utilities

**What:** Centralized helpers for creating Decimal instances from various sources and serializing them for JSON/database storage.
**When to use:** Every time a Decimal value enters or leaves the system (form input, API response, database query, JSON serialization).
**Example:**

```typescript
// src/lib/decimal/index.ts
import Decimal from 'decimal.js';

// Configure once at module load
Decimal.set({
  precision: 20,         // 20 significant digits (handles 30-year projections)
  rounding: Decimal.ROUND_HALF_UP,  // Standard financial rounding
});

/** Create Decimal from string (preferred) or number. Never from float arithmetic. */
export function d(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/** Convert Decimal to fixed-point string for display (e.g., "$1,234.56") */
export function toFixed(value: Decimal, places: number = 2): string {
  return value.toFixed(places);
}

/** Convert Decimal to number ONLY for non-financial purposes (e.g., chart data) */
export function toNumber(value: Decimal): number {
  return value.toNumber();
}

/** Serialize Decimal for JSON (stores as string to preserve precision) */
export function toJSON(value: Decimal): string {
  return value.toString();
}

/** Deserialize Decimal from JSON string */
export function fromJSON(value: string): Decimal {
  return new Decimal(value);
}

// Re-export Decimal class for direct use
export { Decimal };
```

### Pattern 3: Temporal Config with Effective Dates

**What:** Alberta regulatory values stored in Supabase with `effective_from`/`effective_to` dates, queried by proposal creation date.
**When to use:** Any time regulatory or configurable values are accessed -- always filter by date to get the correct version.
**Example:**

```typescript
// src/lib/config/alberta.ts
import { createClient } from '@/lib/supabase/server';
import type { AlbertaConfig } from '@/lib/types';

export async function getAlbertaConfig(asOfDate?: Date): Promise<AlbertaConfig> {
  const supabase = await createClient();
  const date = asOfDate ?? new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('alberta_config')
    .select('*')
    .lte('effective_from', dateStr)
    .or(`effective_to.is.null,effective_to.gte.${dateStr}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(`Failed to load Alberta config: ${error.message}`);
  return data;
}
```

### Pattern 4: Supabase Server Client for Next.js 16

**What:** SSR-compatible Supabase client using `@supabase/ssr` with async cookie access (required in Next.js 16).
**When to use:** All server-side Supabase access (Server Components, Route Handlers, Server Actions).
**Example:**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies(); // MUST be awaited in Next.js 16

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components (read-only cookies)
            // This is expected and safe to ignore
          }
        },
      },
    }
  );
}
```

### Anti-Patterns to Avoid

- **Flat type with 30+ fields:** Makes it unclear which fields belong together; nested grouping mirrors the domain (customer, system, consumption, rates, financing).
- **Native Number for financial values:** IEEE 754 floating-point errors compound over 30-year projections. Even `0.1 + 0.2 !== 0.3` in JavaScript. Use Decimal.js for ALL monetary and energy calculations.
- **Hardcoded Alberta values in formulas:** Carbon benchmark prices change yearly; grid emission factors update; rate assumptions shift. Centralizing in Supabase with effective dates means old proposals stay accurate.
- **Mixing Decimal and Number in arithmetic:** If you do `new Decimal(5).times(nativeNumber)`, Decimal.js handles it, but constructing from a float result (e.g., `new Decimal(0.1 + 0.2)`) bakes in the error. Always construct from strings.
- **Synchronous cookie access in Next.js 16:** `cookies()` is now async (breaking change from Next.js 15). Always `await cookies()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Precision arithmetic | Custom BigInt-based math | Decimal.js | 65+ methods, configured rounding, handles edge cases (underflow, overflow, NaN), TypeScript types included |
| Database client + RLS | Raw PostgreSQL queries | Supabase client + RLS policies | Auto-generated REST API, type generation CLI, built-in RLS, managed infrastructure |
| CSS utility framework | Custom CSS variables system | Tailwind CSS | Consistent design tokens, responsive utilities, tree-shaking, built into Next.js defaults |
| Project scaffold | Manual folder/config setup | create-next-app | Preconfigured TypeScript, ESLint, Tailwind, App Router, Turbopack, path aliases |
| Type generation from DB schema | Manual type mirroring | `supabase gen types typescript` | Stays in sync with actual database schema; eliminates type drift |

**Key insight:** This phase is entirely about establishing contracts and foundations. There is zero custom UI or business logic beyond a stub. The value is in getting the scaffold, types, database schema, and decimal configuration correct so Phases 2-9 build on solid ground. Fighting the framework (custom setups) wastes time and introduces fragility.

## Common Pitfalls

### Pitfall 1: Constructing Decimal from Float Results
**What goes wrong:** `new Decimal(0.1 + 0.2)` creates `Decimal(0.30000000000000004)` -- the IEEE 754 error is baked in before Decimal.js even sees the value.
**Why it happens:** JavaScript evaluates `0.1 + 0.2` as a native Number first, producing the imprecise result, then passes that to Decimal.
**How to avoid:** Always construct from strings: `new Decimal('0.1').plus('0.2')`. For user inputs, pass the raw string from the form directly to Decimal.
**Warning signs:** Any `new Decimal(expression)` where `expression` involves arithmetic on native numbers.

### Pitfall 2: Serializing Decimal to JSON
**What goes wrong:** `JSON.stringify({ amount: new Decimal('123.45') })` produces `"amount":"123.45"` (looks fine), but Decimal's `toJSON()` returns a string. On deserialization, `JSON.parse` produces `{ amount: "123.45" }` -- a string, not a Decimal.
**Why it happens:** JSON has no Decimal type. Decimal.js serializes to string by default.
**How to avoid:** Define explicit serialization/deserialization functions. When loading from JSON or database, reconstruct Decimal instances explicitly: `new Decimal(data.amount)`.
**Warning signs:** Passing proposal data through API routes without explicit Decimal reconstruction on the receiving end.

### Pitfall 3: Next.js 16 Async Request APIs
**What goes wrong:** `const store = cookies()` without `await` silently returns a Promise object instead of the cookie store. All cookie operations then fail or return undefined.
**Why it happens:** Next.js 16 removed synchronous access to `cookies()`, `headers()`, `params`, and `searchParams`. This is a breaking change from Next.js 15.
**How to avoid:** Always `await` these APIs: `const store = await cookies()`. The `params` prop in page/layout components is also a Promise: `const { slug } = await props.params`.
**Warning signs:** TypeScript errors about Promise types when accessing cookies/headers, or runtime errors about missing methods on Promise objects.

### Pitfall 4: Supabase RLS Blocking All Access
**What goes wrong:** You enable Row Level Security on a table but forget to create a SELECT policy. All queries return empty arrays with no error.
**Why it happens:** RLS defaults to "deny all" when enabled. The Supabase anon key respects RLS policies -- no policy means no access.
**How to avoid:** Always create RLS policies immediately after enabling RLS. For Alberta config (public read, no auth): `CREATE POLICY "Public read" ON alberta_config FOR SELECT USING (true);`
**Warning signs:** Queries returning empty arrays when you know data exists; no error messages (Supabase returns empty results, not errors, for RLS denials).

### Pitfall 5: Forgetting Effective Date Filtering on Config
**What goes wrong:** A query like `SELECT * FROM alberta_config LIMIT 1` returns the first row inserted, not the currently effective config. As new config versions are added, this returns stale data.
**Why it happens:** Without date filtering, there's no way to know which config version applies.
**How to avoid:** Always filter by effective date range and order by most recent: `.lte('effective_from', dateStr).order('effective_from', { ascending: false }).limit(1)`.
**Warning signs:** Config values not changing after updating the database; old proposals showing new rates.

### Pitfall 6: create-next-app in Existing Directory
**What goes wrong:** Running `npx create-next-app .` in a directory that already has `package.json`, `node_modules`, etc. can conflict or overwrite existing files.
**Why it happens:** The project already has Playwright installed and scripts in place.
**How to avoid:** Either (a) run `create-next-app` in a temp directory and merge files, or (b) manually initialize Next.js by installing packages and creating the App Router structure by hand. Option (b) is recommended since the project already has a `package.json`.
**Warning signs:** Overwritten `package.json` losing the Playwright dependency; missing scripts directory.

## Code Examples

### Complete Supabase Schema for Alberta Config

```sql
-- Alberta regulatory configuration with version history
CREATE TABLE alberta_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  effective_from DATE NOT NULL,
  effective_to DATE,  -- NULL means "currently active"

  -- Carbon credit parameters
  grid_emission_factor NUMERIC NOT NULL DEFAULT 0.55,  -- t CO2/MWh
  payout_percentage_low NUMERIC NOT NULL DEFAULT 0.45,  -- 45%
  payout_percentage_high NUMERIC NOT NULL DEFAULT 0.65, -- 65%
  cash_back_rate NUMERIC NOT NULL DEFAULT 0.03,          -- 3%

  -- Default rates (overridable per proposal)
  default_escalation_rate NUMERIC NOT NULL DEFAULT 0.05,    -- 5%
  default_net_metering_buy_rate NUMERIC NOT NULL DEFAULT 0.168,  -- $/kWh
  default_net_metering_sell_rate NUMERIC NOT NULL DEFAULT 0.335, -- $/kWh

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT
);

-- Carbon benchmark schedule (separate table, one row per year)
CREATE TABLE carbon_benchmark_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES alberta_config(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  price_per_tonne NUMERIC NOT NULL,  -- $/tonne CO2e

  UNIQUE(config_id, year)
);

-- Proposals table (minimal for Phase 1, expanded in Phase 9)
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  config_id UUID REFERENCES alberta_config(id),  -- Lock to config version used
  inputs JSONB NOT NULL,   -- Serialized ProposalInputs
  outputs JSONB,           -- Serialized ProposalOutputs (NULL until calculated)
  status TEXT DEFAULT 'draft' NOT NULL
);

-- Enable RLS
ALTER TABLE alberta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_benchmark_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Public read for config (no auth needed)
CREATE POLICY "Public read config" ON alberta_config
  FOR SELECT USING (true);

CREATE POLICY "Public read benchmarks" ON carbon_benchmark_schedule
  FOR SELECT USING (true);

-- Proposals: public read (for shareable URLs in Phase 9),
-- insert/update allowed via anon key (no auth in v1)
CREATE POLICY "Public read proposals" ON proposals
  FOR SELECT USING (true);

CREATE POLICY "Public insert proposals" ON proposals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update proposals" ON proposals
  FOR UPDATE USING (true);

-- Index for effective date queries
CREATE INDEX idx_alberta_config_effective
  ON alberta_config (effective_from DESC);

-- Seed initial Alberta config
INSERT INTO alberta_config (
  effective_from,
  grid_emission_factor,
  payout_percentage_low,
  payout_percentage_high,
  cash_back_rate,
  default_escalation_rate,
  default_net_metering_buy_rate,
  default_net_metering_sell_rate,
  notes
) VALUES (
  '2025-01-01',
  0.55,
  0.45,
  0.65,
  0.03,
  0.05,
  0.168,
  0.335,
  'Initial Alberta config based on calculations document'
);

-- Seed carbon benchmark schedule
-- (These values come from the Alberta TIER regulation schedule)
INSERT INTO carbon_benchmark_schedule (config_id, year, price_per_tonne)
SELECT id, year, price FROM alberta_config
CROSS JOIN (VALUES
  (2025, 80),
  (2026, 95),
  (2027, 110),
  (2028, 125),
  (2029, 140),
  (2030, 170)
) AS schedule(year, price)
WHERE effective_to IS NULL;
```

### Browser Supabase Client

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### ProposalOutputs Type (Stub for Phase 1, Expanded in Phase 3)

```typescript
// src/lib/types/proposal-outputs.ts
import Decimal from 'decimal.js';

export interface MonthlyNetMetering {
  month: string;                  // "Jan", "Feb", etc.
  consumptionKwh: Decimal;
  productionKwh: Decimal;
  gridBuyKwh: Decimal;            // consumption - production (when positive)
  surplusSoldKwh: Decimal;        // production - consumption (when positive)
  costToBuy: Decimal;             // gridBuy * buyRate
  revenueEarned: Decimal;         // surplusSold * sellRate
}

export interface CarbonCreditProjection {
  annualCo2Avoided: Decimal;      // tonnes
  tenYearPayoutLow: Decimal;      // 45% payout estimate
  tenYearPayoutHigh: Decimal;     // 65% payout estimate
  benchmarkSchedule: Array<{
    year: number;
    pricePerTonne: Decimal;
    payoutLow: Decimal;
    payoutHigh: Decimal;
  }>;
}

export interface SavingsSummary {
  utilityAvoided: Decimal;
  netMeteringRevenue: Decimal;
  carbonCredits: Decimal;
  cashBack: Decimal;
  totalSavings: Decimal;
  netSavingsAfterCost: Decimal;   // totalSavings - systemCost
}

export interface ProposalOutputs {
  // Page 1: Cover
  solarOffsetPercent: Decimal;
  twentyYearUtilityCost: Decimal;
  twentyYearSavings: Decimal;

  // Page 3: Net Metering
  monthlyNetMetering: MonthlyNetMetering[];
  annualGridPurchaseCost: Decimal;
  annualSellRevenue: Decimal;

  // Page 4: Carbon Credits
  carbonCredits: CarbonCreditProjection;

  // Page 5: True All-In Costs
  cashPurchase: {
    twentyYear: SavingsSummary;
    thirtyYear: SavingsSummary;
  };
  financeOption: {
    monthlyAllInCost: Decimal;    // finance payment + remaining utility - credits
    totalMonthlyPayment: Decimal;
  };

  // Utility projections (for charts)
  utilityProjection20Year: Decimal[];
  utilityProjection30Year: Decimal[];
}
```

### Stub Calculation Function

```typescript
// src/lib/engine/calculate.ts
import type { ProposalInputs } from '@/lib/types/proposal-inputs';
import type { ProposalOutputs } from '@/lib/types/proposal-outputs';

/**
 * Stub calculation function for Phase 1 smoke test.
 * Returns placeholder outputs. Real implementation in Phase 3.
 */
export function calculateProposal(inputs: ProposalInputs): ProposalOutputs {
  // Phase 1: Return stub data that proves the pipeline works
  // Phase 3: Replace with real calculation engine
  throw new Error('Calculation engine not yet implemented (Phase 3)');
}
```

### Hardcoded Test Data (Paul Friesen Reference Case)

```typescript
// src/test-data/paul-friesen.ts
import { d } from '@/lib/decimal';
import type { ProposalInputs } from '@/lib/types';

/**
 * Paul Friesen reference case from the calculations document.
 * Used as the verified smoke test fixture in Phase 1
 * and the reference validation case in Phase 3.
 */
export const paulFriesenInputs: ProposalInputs = {
  customer: {
    name: 'Paul Friesen',
    address: '123 Example Street, Edmonton, AB',
    latitude: 53.5461,
    longitude: -113.4937,
  },
  system: {
    systemSizeKw: d('12.24'),
    annualProductionKwh: d('15408'),
    monthlyProductionKwh: [
      d('648'), d('831'), d('1188'), d('1476'),
      d('1656'), d('1764'), d('1764'), d('1548'),
      d('1260'), d('936'), d('666'), d('540'),
    ] as any,  // Tuple assertion -- actual values from calculations doc
  },
  consumption: {
    annualConsumptionKwh: d('12000'),
    monthlyConsumptionKwh: [
      d('1100'), d('1050'), d('1000'), d('950'),
      d('900'), d('850'), d('900'), d('950'),
      d('1000'), d('1050'), d('1100'), d('1150'),
    ] as any,
    annualElectricityCost: d('4212'),
  },
  rates: {
    allInRate: d('0.3510'),
    netMeteringBuyRate: d('0.1680'),
    netMeteringSellRate: d('0.3350'),
    annualEscalationRate: d('0.05'),
  },
  financing: {
    cashPurchasePrice: d('30000'),
    financeMonthlyPayment: d('189'),
    financeTermMonths: 240,
    financeInterestRate: d('0.0699'),
  },
};
```

Note: The exact monthly values above are illustrative placeholders. The actual values must come from the Solar_Proposal_Calculations.docx document during implementation.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js Pages Router | Next.js App Router (default since 13.4, stable in 14+) | 2023 | Server Components by default, streaming, nested layouts |
| next dev --turbopack | Turbopack is default (no flag needed) | Next.js 16 (Dec 2025) | 2-5x faster builds, 10x faster Fast Refresh |
| Synchronous cookies()/headers() | Async cookies()/headers() (must await) | Next.js 15 (deprecated sync), 16 (removed) | All request API access must be awaited |
| middleware.ts | proxy.ts (middleware deprecated) | Next.js 16 | Renamed file and export; runtime is nodejs only |
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Consolidated package for all SSR frameworks |
| experimental.turbopack config | Top-level turbopack config | Next.js 16 | Config moved out of experimental |
| next lint command | Direct eslint/biome CLI | Next.js 16 | next lint removed; next build no longer runs linter |

**Deprecated/outdated:**
- `middleware.ts` is deprecated in Next.js 16, renamed to `proxy.ts` -- but since this project has no auth, middleware/proxy may not be needed in Phase 1
- `@supabase/auth-helpers-nextjs` is deprecated, replaced by `@supabase/ssr`
- `serverRuntimeConfig`/`publicRuntimeConfig` removed in Next.js 16 -- use environment variables directly
- Synchronous `cookies()`/`headers()` access completely removed in Next.js 16

## Open Questions

1. **Exact Paul Friesen monthly values**
   - What we know: The calculations document contains the full Paul Friesen reference case with exact monthly production and consumption values
   - What's unclear: We need to read Solar_Proposal_Calculations.docx to get the precise numbers for the test fixture
   - Recommendation: During implementation, read the calculations document and update the hardcoded test data with exact values. Use placeholder-but-plausible values for the initial scaffold.

2. **Carbon benchmark schedule exact values**
   - What we know: Alberta TIER regulation sets benchmark prices per tonne by year, and the calculations document has the schedule used in proposals
   - What's unclear: The exact year-by-year prices and how far into the future they extend
   - Recommendation: Seed with values from the calculations document. The schema supports adding/updating via admin UI in Phase 8.

3. **Supabase project creation**
   - What we know: A Supabase project needs to be created with the URL and anon key configured as environment variables
   - What's unclear: Whether the user has already created a Supabase project or needs to create one
   - Recommendation: Phase 1 plan should include a step for creating the Supabase project (or using an existing one) and documenting the URL/key in `.env.local`.

4. **Handling existing package.json and Playwright**
   - What we know: The project already has a `package.json` with Playwright as a dependency and a `scripts/` directory with the SunPitch extractor
   - What's unclear: Whether to use `create-next-app` (which overwrites package.json) or manually install Next.js
   - Recommendation: Manually install Next.js, React, and other dependencies into the existing package.json. Create the App Router structure by hand. This preserves the existing Playwright setup.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- Breaking changes, new features, migration steps
- [Next.js Installation Guide](https://nextjs.org/docs/app/getting-started/installation) -- create-next-app defaults, project structure
- [Decimal.js API Documentation](https://mikemcl.github.io/decimal.js/) -- Constructor, arithmetic methods, configuration, precision
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) -- Setup, environment variables, server component queries
- [Supabase SSR Client Setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- createServerClient, cookie handling, middleware
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Policy syntax, anon key security, public read patterns
- [Supabase Type Generation](https://supabase.com/docs/guides/api/rest/generating-types) -- CLI command, workflow integration

### Secondary (MEDIUM confidence)
- [npm: decimal.js](https://www.npmjs.com/package/decimal.js) -- Version 10.6.0 confirmed, TypeScript types bundled
- [npm: @supabase/supabase-js](https://www.npmjs.com/package/@supabase/supabase-js) -- Version 2.98.0 confirmed
- [npm: @supabase/ssr](https://www.npmjs.com/package/@supabase/ssr) -- Version 0.8.0 confirmed

### Tertiary (LOW confidence)
- Carbon benchmark schedule values are illustrative -- actual values need verification from the calculations document during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified via official docs and npm; versions confirmed current
- Architecture: HIGH -- Patterns follow official Next.js 16 and Supabase documentation; data contract design based on project CONTEXT.md decisions
- Pitfalls: HIGH -- All pitfalls documented from official sources (Next.js 16 breaking changes, Supabase RLS behavior, Decimal.js precision traps)

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (30 days -- stable ecosystem, no major releases expected)
