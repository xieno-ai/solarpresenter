---
phase: 01-foundation-data-schema
plan: 01
subsystem: foundation
tags: [next.js, typescript, decimal.js, tailwind, supabase, data-contracts]

# Dependency graph
requires:
  - phase: none
    provides: "First phase - no dependencies"
provides:
  - ProposalInputs and ProposalOutputs TypeScript data contracts
  - Decimal.js configured with precision 20 and ROUND_HALF_UP
  - d(), toFixed(), toNumber(), toJSON(), fromJSON() helper utilities
  - AlbertaConfig type with CarbonBenchmarkEntry
  - Paul Friesen reference test fixture
  - Stub calculateProposal() engine function
  - Next.js 16 project scaffold with App Router
affects: [02-manual-entry, 03-calculation-engine, 04-proposal-rendering, 01-02-supabase-schema]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19.2.4, typescript@5.9.3, decimal.js@10.6.0, "@supabase/supabase-js@2.98.0", "@supabase/ssr@0.9.0", tailwindcss@4.2.1, "@tailwindcss/postcss@4.2.1"]
  patterns: [nested-data-contracts, decimal-from-strings, monthly-values-tuple, barrel-exports]

key-files:
  created:
    - src/lib/decimal/index.ts
    - src/lib/decimal/decimal.test.ts
    - src/lib/types/proposal-inputs.ts
    - src/lib/types/proposal-outputs.ts
    - src/lib/types/alberta-config.ts
    - src/lib/types/index.ts
    - src/lib/engine/calculate.ts
    - src/test-data/paul-friesen.ts
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - next.config.ts
    - tsconfig.json
    - tailwind.config.ts
    - postcss.config.mjs
    - .env.local.example
    - .gitignore
  modified:
    - package.json

key-decisions:
  - "Nested type grouping (CustomerInfo, SystemInfo, ConsumptionInfo, RateInfo, FinancingInfo) for ProposalInputs"
  - "MonthlyValues as 12-element Decimal tuple type for compile-time length enforcement"
  - "DM Sans + JetBrains Mono font pairing (distinctive, not generic)"
  - "Manual Next.js initialization instead of create-next-app to preserve existing package.json"

patterns-established:
  - "Pattern: Always construct Decimal from strings via d('value'), never from float literals"
  - "Pattern: Barrel exports from src/lib/types/index.ts for all type imports"
  - "Pattern: MonthlyValues tuple type enforces exactly 12 Decimal elements"
  - "Pattern: latitude/longitude and financeTermMonths use number (non-financial), all monetary/energy fields use Decimal"

requirements-completed: [CALC-09]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 1 Plan 1: Foundation & Data Schema Summary

**Next.js 16 scaffold with TypeScript data contracts (ProposalInputs/ProposalOutputs), Decimal.js precision arithmetic (precision 20, ROUND_HALF_UP), and Paul Friesen reference fixture**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T22:13:00Z
- **Completed:** 2026-03-02T22:17:59Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- Next.js 16.1.6 application builds and runs with App Router, Tailwind CSS v4, and TypeScript 5.9
- ProposalInputs type with 5 nested groups (CustomerInfo, SystemInfo, ConsumptionInfo, RateInfo, FinancingInfo) and MonthlyValues tuple
- ProposalOutputs type with MonthlyNetMetering, CarbonCreditProjection, SavingsSummary, and all proposal page data shapes
- AlbertaConfig type with CarbonBenchmarkEntry and effective date fields
- Decimal.js configured with precision 20 and ROUND_HALF_UP, tested with precision and rounding assertions
- Paul Friesen reference fixture with all monetary/energy values as Decimal constructed from strings
- Existing project files preserved (Playwright ^1.58.2, scripts/extract-sunpitch.mjs, 11 reference page PNGs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js project with all dependencies** - `1e9d7b1` (feat)
2. **Task 2 RED: Failing tests for Decimal.js utilities** - `8451c9c` (test)
3. **Task 2 GREEN: TypeScript data contracts, Decimal.js utilities, and test fixture** - `95a2693` (feat)

_Note: Task 2 was TDD with RED (failing test) and GREEN (implementation) commits._

## Files Created/Modified
- `src/lib/decimal/index.ts` - Decimal.js configuration, d() constructor, toFixed/toNumber/toJSON/fromJSON helpers
- `src/lib/decimal/decimal.test.ts` - Precision, rounding, and serialization roundtrip tests
- `src/lib/types/proposal-inputs.ts` - ProposalInputs with nested CustomerInfo, SystemInfo, ConsumptionInfo, RateInfo, FinancingInfo
- `src/lib/types/proposal-outputs.ts` - ProposalOutputs with MonthlyNetMetering, CarbonCreditProjection, SavingsSummary
- `src/lib/types/alberta-config.ts` - AlbertaConfig with CarbonBenchmarkEntry and effective dates
- `src/lib/types/index.ts` - Barrel export for all types
- `src/lib/engine/calculate.ts` - Stub calculateProposal() (Phase 3 placeholder)
- `src/test-data/paul-friesen.ts` - Paul Friesen reference case with all Decimal values
- `src/app/layout.tsx` - Root layout with DM Sans + JetBrains Mono fonts
- `src/app/page.tsx` - Placeholder home page proving dev server works
- `src/app/globals.css` - Tailwind v4 import
- `next.config.ts` - Minimal Next.js config
- `tsconfig.json` - TypeScript config with path aliases, strict mode
- `tailwind.config.ts` - Tailwind config with content paths
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `.env.local.example` - Supabase environment variable template
- `.gitignore` - Node.js/Next.js gitignore
- `package.json` - Updated with Next.js scripts and all dependencies

## Decisions Made
- **Nested type grouping:** ProposalInputs uses 5 sub-interfaces (CustomerInfo, SystemInfo, ConsumptionInfo, RateInfo, FinancingInfo) matching domain sections and future form layout
- **MonthlyValues tuple:** Used 12-element Decimal tuple type for compile-time enforcement of exactly 12 months
- **Font pairing:** DM Sans (body) + JetBrains Mono (code/labels) -- distinctive and elegant, avoiding generic fonts
- **Manual initialization:** Installed Next.js dependencies into existing package.json instead of using create-next-app, preserving Playwright and existing project structure
- **Type-only Decimal imports:** Used `import type Decimal from 'decimal.js'` in type files to avoid bundling Decimal.js in type-only modules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created .gitignore for project**
- **Found during:** Task 1 (commit preparation)
- **Issue:** No .gitignore existed, would commit node_modules/ and .next/ build artifacts
- **Fix:** Created standard .gitignore with node_modules, .next, .env, build output patterns
- **Files modified:** .gitignore
- **Verification:** git status correctly ignores node_modules/ and .next/
- **Committed in:** 1e9d7b1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for correct git operation. No scope creep.

## Issues Encountered
None - plan executed smoothly.

## User Setup Required
None - no external service configuration required for this plan. Supabase setup is in plan 01-02.

## Next Phase Readiness
- All TypeScript data contracts ready for Phase 2 (manual entry form) and Phase 3 (calculation engine)
- Decimal.js configured and tested, ready for financial calculations
- Paul Friesen fixture ready for Phase 3 validation testing
- Next plan (01-02) will add Supabase schema, Alberta config data layer, and smoke test page

## Self-Check: PASSED

---
*Phase: 01-foundation-data-schema*
*Completed: 2026-03-02*
