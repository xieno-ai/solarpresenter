---
phase: 01-foundation-data-schema
plan: 02
subsystem: supabase, alberta-config
tags: [supabase, database, alberta-config, smoke-test, rls]

# Dependency graph
requires:
  - phase: 01-01
    provides: "TypeScript data contracts, Decimal.js utilities, Paul Friesen fixture"
provides:
  - Supabase schema (alberta_config, carbon_benchmark_schedule, proposals tables)
  - Seed data with Alberta regulatory values and 6-year carbon benchmark schedule
  - Server and browser Supabase clients for Next.js 16
  - getAlbertaConfig() with effective date filtering returning Decimal-typed values
  - End-to-end smoke test page proving data pipeline works
affects: [02-manual-entry, 03-calculation-engine, 09-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-ssr-async-cookies, effective-date-filtering, numeric-to-decimal-conversion, graceful-supabase-fallback]

key-files:
  created:
    - supabase/schema.sql
    - supabase/seed.sql
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/types.ts
    - src/lib/config/alberta.ts
  modified:
    - src/app/page.tsx
    - .env.local.example

key-decisions:
  - "Supabase NUMERIC columns returned as strings — passed directly to d() constructor, never through float"
  - "RLS with public SELECT on config tables, public all on proposals (no auth in v1)"
  - "Effective date filtering: .lte('effective_from', date).or('effective_to.is.null,...') for version history"
  - "Smoke test page gracefully handles missing Supabase connection with fallback message"

patterns-established:
  - "Pattern: Supabase server client uses async cookies() for Next.js 16 compatibility"
  - "Pattern: Alberta config values always fetched via getAlbertaConfig(), never imported from constants"
  - "Pattern: Database NUMERIC → Decimal via d(stringValue), preserving full precision"

requirements-completed: [CALC-10]

# Metrics
duration: ~10min (auto tasks) + user setup/verification
completed: 2026-03-02
---

# Phase 1 Plan 2: Supabase Schema & Smoke Test Summary

**Supabase database integration with Alberta config schema, seed regulatory data, config access layer with effective date filtering, and end-to-end smoke test page**

## Performance

- **Duration:** ~10 min (execution) + user Supabase setup
- **Completed:** 2026-03-02
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files created/modified:** 8

## Accomplishments
- Supabase schema with alberta_config, carbon_benchmark_schedule, and proposals tables, all with RLS policies
- Seed data with current Alberta regulatory values (grid factor 0.55, payout 45-65%, cash back 3%, escalation 5%, net metering buy 16.8c/sell 33.5c) and 6-year carbon benchmark schedule (2025-2030, $80-$170/tonne)
- Server and browser Supabase clients following Next.js 16 async cookie patterns
- getAlbertaConfig() fetches config by effective date, converts NUMERIC to Decimal types
- Smoke test page at localhost:3000 displays Paul Friesen data, Alberta config from Supabase, Decimal.js precision proof (0.1+0.2=0.3), and ROUND_HALF_UP verification (1.005→1.01)
- Page gracefully handles missing Supabase connection without crashing

## Task Commits

1. **Task 1: Supabase schema, clients, and Alberta config data layer** - `9b62d41` (feat)
2. **Task 2: Smoke test page with end-to-end data pipeline** - `d736726` (feat)
3. **Task 3: User verified smoke test** - Approved (all 4 checks passed)

## Files Created/Modified
- `supabase/schema.sql` - Complete database schema with 3 tables, RLS policies, and indexes
- `supabase/seed.sql` - Alberta config values and 6-year carbon benchmark schedule
- `src/lib/supabase/server.ts` - SSR-compatible Supabase client with async cookies()
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/types.ts` - Database type stub (regenerate with supabase gen types)
- `src/lib/config/alberta.ts` - Alberta config fetch with effective date filtering, Decimal conversion
- `src/app/page.tsx` - Smoke test page showing full data pipeline
- `.env.local.example` - Updated with Supabase env var documentation

## User Verification

User confirmed all smoke test checks:
1. Page renders at localhost:3000
2. Paul Friesen data displays (name, 12.24 kW system, 15408 kWh, rates, monthly table)
3. Alberta config from Supabase (grid factor 0.55, payout 45-65%, 6-year benchmark schedule)
4. Decimal precision: 0.1 + 0.2 = exactly 0.3, ROUND_HALF_UP: d('1.005').toFixed(2) = 1.01

## Deviations from Plan

None — plan executed as specified.

## Issues Encountered
None.

## Next Phase Readiness
- Phase 1 is COMPLETE — all success criteria met:
  1. Next.js app runs with working dev server ✓
  2. ProposalInputs/ProposalOutputs types defined and importable ✓
  3. All monetary arithmetic uses Decimal.js ✓
  4. Alberta config stored in Supabase with effective dates, not hardcoded ✓
  5. End-to-end smoke test passes ✓
- Ready for Phase 2: Manual Entry form with validation

## Self-Check: PASSED

---
*Phase: 01-foundation-data-schema*
*Completed: 2026-03-02*
