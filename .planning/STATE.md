---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-03T22:59:40.596Z"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 14
  completed_plans: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** Given a SunPitch URL or manually entered numbers, produce a pixel-accurate 11-page solar proposal PDF with all financial calculations computed correctly from documented formulas.
**Current focus:** Phase 5 - PDF Generation

## Current Position

Phase: 5 of 9 (PDF Generation) — IN PROGRESS (verification complete, awaiting phase sign-off)
Plan: 2 of 2 in Phase 5 — COMPLETE
Status: Phase 5 both plans complete — PDF export human-verified and approved
Last activity: 2026-03-03 - Completed quick task 3: mark phase 4 as complete. all pages reviewed. write summary

Progress: [███████████████░░░░░] 75% (15/~20 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~10min
- Total execution time: ~0.70 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/2 | ~15min | ~8min |
| 2. Manual Entry | 3/3 | ~70min | ~23min |
| 3. Calculation Engine | 3/3 | ~16min | ~5min |

**Recent Trend:**
- Last 5 plans: 02-02 (~10min), 02-03 (~45min), 03-01 (~12min), 03-02 (~2min), 03-03 (~2min)
- Trend: Consistent, fast execution

*Updated after each plan completion*
| Phase 02-manual-entry P02 | 10 | 2 tasks | 4 files |
| Phase 02-manual-entry P03 | 45 | 2 tasks | 2 files |
| Phase 03-calculation-engine P01 | 12 | 2 tasks | 7 files |
| Phase 03-calculation-engine P02 | 2 | 2 tasks | 2 files |
| Phase 03-calculation-engine P03 | 2 | 2 tasks | 2 files |
| Phase 04-proposal-rendering P01 | 2 | 2 tasks | 5 files |
| Phase 04-proposal-rendering P02 | 5 | 3 tasks | 7 files |
| Phase 04-proposal-rendering P03 | 5 | 2 tasks | 8 files |
| Phase 05-pdf-generation P01 | 3 | 2 tasks | 6 files |

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
- [Phase 02-02]: Controller (not register) for monthly inputs — programmatic setValue requires controlled components
- [Phase 02-02]: syncSource ref prevents infinite watch loop between annual→monthly and monthly→annual effects
- [Phase 02-manual-entry]: emptyRequiredFieldCount derived from watch() scalar values floors errorCount to prevent 'Ready to generate' on blank form in onBlur mode
- [03-01]: Carbon benchmark schedule uses approximated 2024 Alberta values ($65-$230/tonne); CALC-05 tests assert range condition (45-65%) rather than exact dollar values for robustness
- [03-01]: computeFinanceOption uses base-year (Year 0) values for monthly snapshot — no escalation for 'current year' comparison
- [03-01]: production.greaterThanOrEqualTo(consumption) for surplus detection — equal treated as surplus (locked decision)
- [03-01]: CarbonBenchmarkEntry.payoutLow is pre-computed (pricePerTonne × 0.45); computeCarbonCredits multiplies by annualCo2Avoided only
- [Phase 03-calculation-engine]: carbonCredits field in SavingsSummary uses tenYearPayoutLow for both 20yr and 30yr horizons (conservative carbon estimate)
- [Phase 03-calculation-engine]: annualCarbonCredit for finance option = tenYearPayoutLow / 10 (average annual proxy for current-year monthly snapshot)
- [03-03]: carbonBenchmarkSchedule year filter changed from `year <= 10` to `slice(0, 10)` — Supabase stores calendar years (2025+), test fixtures use relative years (1-10); slice handles both
- [04-01]: CSS variables scoped to .proposal-root (not :root) — prevents NRG light theme bleeding into /enter dark theme
- [04-01]: URL param key is `d` — single base64 blob with btoa(encodeURIComponent(JSON.stringify(values))) for Unicode safety
- [04-01]: Proposal page calls calculateProposal() directly (server component) — not runCalculation server action
- [04-01]: buildSatelliteImageUrl returns null if GOOGLE_MAPS_API_KEY absent — no hard Maps API dependency
- [04-02]: recharts installed with --legacy-peer-deps (vitest peer conflict does not affect runtime)
- [04-02]: Recharts Tooltip formatter typed as (number | undefined) — Recharts 3.x requires nullable value param
- [04-02]: Dynamic import ssr:false applied to both chart components to prevent hydration mismatches
- [04-03]: PriceHistoryPage uses pure inline SVG area chart (no charting library) — avoids Recharts dynamic import complexity for a static page
- [04-03]: FAQPage uses 2-column grid layout instead of vertical accordion — fits proposal-page height constraint without scrolling
- [04-03]: NextStepsPage uses 2-column grid of step cards rather than a vertical timeline — better space utilization in fixed viewport
- [04-04]: All 11 pages manually reviewed and redesigned pixel-perfect vs reference PNGs; ProposalFAB added (fixed position, speed dial with 3 links: NAIT snow study, hail test video, solarclub.ca); FAQPage and NextStepsPage fully replaced with reference-matching layouts
- [05-01]: emulateMedia('screen') must be called before page.goto() — ensures screen CSS active from start of page load, prevents @media print stripping backgrounds
- [05-01]: PDF render target returns error div (not redirect) on missing d param — Playwright redirect would fail silently
- [05-01]: Buffer from page.pdf() must be converted to Uint8Array for Next.js Response BodyInit compatibility (TypeScript 5.x)
- [05-01]: Viewport set to 816x1056 (Letter at 96 DPI) before goto so vw/vh resolve to correct paper dimensions

### Pending Todos

None yet.

### Blockers/Concerns

- Calculation formula details require access to the Word document (c:\Users\David\Downloads\Solar_Proposal_Calculations.docx) during Phase 3 planning
- SunPitch DOM structure must be investigated during Phase 6 planning -- selectors cannot be designed in advance
- Alberta bill format variations across 5 providers need sample bills for Phase 7 acceptance testing

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | scaffold Alberta config types and seed data | 2026-03-02 | — | [1-scaffold-alberta-config-types-and-seed-](./quick/1-scaffold-alberta-config-types-and-seed-/) |
| 2 | add annualGridPurchaseCost and annualSellRevenue props | 2026-03-03 | — | [2-add-annualgridpurchasecost-and-annualsell](./quick/2-add-annualgridpurchasecost-and-annualsell/) |
| 3 | mark phase 4 as complete. all pages reviewed. write summary | 2026-03-03 | 8736cd1 | [3-mark-phase-4-as-complete-all-pages-revie](./quick/3-mark-phase-4-as-complete-all-pages-revie/) |

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 05-01-PLAN.md — Playwright PDF pipeline implemented. /proposal/pdf render target, /api/pdf GET route, ProposalFAB Download PDF action with loading/error state. TypeScript clean. Ready for Plan 05-02 verification checkpoint.
Resume file: None
