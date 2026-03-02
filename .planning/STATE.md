# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** Given a SunPitch URL or manually entered numbers, produce a pixel-accurate 11-page solar proposal PDF with all financial calculations computed correctly from documented formulas.
**Current focus:** Phase 2 - Manual Entry

## Current Position

Phase: 2 of 9 (Manual Entry)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-02 - 02-01 complete (form lib foundation: schema, defaults, persistence, server action)

Progress: [███░░░░░░░░░░░░░░░░░] 15% (3/~20 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: ~10min
- Total execution time: ~0.40 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/2 | ~15min | ~8min |
| 2. Manual Entry | 1/3 | ~15min | ~15min |

**Recent Trend:**
- Last 5 plans: 01-01 (5min), 01-02 (~10min), 02-01 (~15min)
- Trend: Consistent, fast execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 9-phase build order follows dependency chain: foundation -> manual entry -> calculations -> rendering -> PDF -> scraping -> bill extraction -> rates -> sharing
- [Roadmap]: Decimal.js and centralized Alberta config are Phase 1 foundations -- cannot be retrofitted
- [01-01]: Nested type grouping (CustomerInfo, SystemInfo, ConsumptionInfo, RateInfo, FinancingInfo) for ProposalInputs
- [01-01]: MonthlyValues as 12-element Decimal tuple type for compile-time length enforcement
- [01-01]: DM Sans + JetBrains Mono font pairing
- [01-01]: Manual Next.js initialization instead of create-next-app to preserve existing package.json
- [01-02]: Supabase NUMERIC returned as strings — passed directly to d(), never through float
- [01-02]: Effective date filtering for Alberta config version history
- [01-02]: Smoke test page gracefully handles missing Supabase connection
- [02-01]: numericString() Zod helper with refine() chain for all numeric form inputs
- [02-01]: All form fields are strings — Decimal conversion happens at calculation boundary (Phase 3)
- [02-01]: Monthly arrays initialized with Array(12).fill('0') not '' — RHF requires values at registration
- [02-01]: allInRate and netMeteringBuyRate both initialize from defaultNetMeteringBuyRate (user can differentiate)
- [02-01]: Vitest chosen over Jest — native ESM support, no Babel transform needed

### Pending Todos

None yet.

### Blockers/Concerns

- Calculation formula details require access to the Word document (c:\Users\David\Downloads\Solar_Proposal_Calculations.docx) during Phase 3 planning
- SunPitch DOM structure must be investigated during Phase 6 planning -- selectors cannot be designed in advance
- Alberta bill format variations across 5 providers need sample bills for Phase 7 acceptance testing

## Session Continuity

Last session: 2026-03-02
Stopped at: 02-01 complete — form lib foundation. Ready for 02-02 (form components)
Resume file: None
