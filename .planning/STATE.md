---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-03T20:15:00Z"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 15
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-02)

**Core value:** Given a SunPitch URL or manually entered numbers, produce a pixel-accurate 11-page solar proposal PDF with all financial calculations computed correctly from documented formulas.
**Current focus:** Phase 6 - SunPitch Scraping

## Current Position

Phase: 6 of 9 (SunPitch Scraping) — COMPLETE (all 3 plans done)
Plan: 3 of 3 in Phase 6 — COMPLETE
Status: Phase 6 complete — SunPitch scraper calibrated against real API; correct field mapping confirmed for customer name/address, utility rate, annual consumption, monthly production (per zone), system size, and system cost
Last activity: 2026-03-04 - Completed quick task 9: scrape cash and finance values from SunPitch proposal

Progress: [██████████████████░░] 90% (18/~20 plans)

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
| Phase 06-sunpitch-scraping P02 | 2 | 2 tasks | 2 files |

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
- [06-01]: /api/scrape returns HTTP 200 even on scrape failures — client reads status field not HTTP code; only structural errors (bad JSON, missing url) return 4xx
- [06-01]: normalizeMonthlyArray() always pads/trims to exactly 12 string entries using '0' as fill
- [06-01]: annualElectricityCost excluded from missingFields — computed by watch() in form, not scraped
- [06-01]: Redirect detection checks page.url() for /facing/proposals/ after goto — catches silent auth redirects
- [06-02]: highlightClass() helper centralizes ring/bg ternary logic rather than repeating at each of 14+ fields
- [06-02]: Form sections and GenerateFooter wrapped in {activeTab === 'manual'} — footer never shows on sunpitch tab
- [06-02]: annualElectricityCost Controller has no highlight wrapper — computed by watch(), never scraped
- [06-02]: markScraped() walker is shallow (one level) — matches flat ScrapeResult.data shape from Plan 01
- [06-03]: SunPitch API takes 10–60s to respond — route.fetch timeout 60s, polling loop 55s (original 2s wait captured nothing)
- [06-03]: page.on('response') + response.body() cannot buffer Angular XHR bodies — replaced with page.route() + route.fetch()
- [06-03]: Direct Node fetch of /api/proposals hangs (server requires browser session context) — browser-only strategy
- [06-03]: API field mapping: customer.firstName/lastName, utility.rate ($/kWh), config.projections (kWh/day/zone), editor.TotalSolarPanel × equipment.panel.valueWh for system size, selected adders for cash price
- [06-03]: netMeteringSellRate and annualEscalationRate always missing from SunPitch API — user enters manually

### Pending Todos

None yet.

### Blockers/Concerns

- Calculation formula details require access to the Word document (c:\Users\David\Downloads\Solar_Proposal_Calculations.docx) during Phase 3 planning
- SunPitch DOM structure investigated and resolved in 06-03 — scraper calibrated against real API
- Alberta bill format variations across 5 providers need sample bills for Phase 7 acceptance testing

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | scaffold Alberta config types and seed data | 2026-03-02 | — | [1-scaffold-alberta-config-types-and-seed-](./quick/1-scaffold-alberta-config-types-and-seed-/) |
| 2 | add annualGridPurchaseCost and annualSellRevenue props | 2026-03-03 | — | [2-add-annualgridpurchasecost-and-annualsell](./quick/2-add-annualgridpurchasecost-and-annualsell/) |
| 3 | mark phase 4 as complete. all pages reviewed. write summary | 2026-03-03 | 8736cd1 | [3-mark-phase-4-as-complete-all-pages-revie](./quick/3-mark-phase-4-as-complete-all-pages-revie/) |
| 4 | fix SunPitch scraper production total — kWh/panel/month × zone panel counts | 2026-03-04 | 11069db | [4-fix-sunpitch-scraper-production-total-an](./quick/4-fix-sunpitch-scraper-production-total-an/) |
| 5 | add SunPitch import tab and UI on the enter page | 2026-03-04 | 0d8884c | [5-add-sunpitch-import-tab-and-ui-on-the-en](./quick/5-add-sunpitch-import-tab-and-ui-on-the-en/) |
| 6 | fix vitest and coverage-v8 peer dependency mismatch blocking Vercel deploy | 2026-03-04 | 4615bbd | [6-fix-vitest-and-coverage-v8-peer-dependen](./quick/6-fix-vitest-and-coverage-v8-peer-dependen/) |
| 7 | fix scraper on Vercel: replace playwright with playwright-core and sparticuz chromium | 2026-03-04 | da1cd21 | [7-fix-scraper-on-vercel-replace-playwright](./quick/7-fix-scraper-on-vercel-replace-playwright/) |
| 5 | add SunPitch import tab polished UI on the enter page | 2026-03-04 | 48fc6a7 | [5-add-sunpitch-import-tab-and-ui-on-the-en](./quick/5-add-sunpitch-import-tab-and-ui-on-the-en/) |
| 8 | fix /api/scrape and /api/pdf 500 errors on Vercel — add outputFileTracingIncludes for @sparticuz/chromium bin files | 2026-03-04 | 6d8bc81 | [8-fix-api-scrape-500-error-on-vercel-deplo](./quick/8-fix-api-scrape-500-error-on-vercel-deplo/) |
| 9 | scrape financeMonthlyPayment and financeTermMonths from SunPitch DOM and sub-API | 2026-03-04 | e3e5567 | [9-scrape-cash-and-finance-values-from-sunp](./quick/9-scrape-cash-and-finance-values-from-sunp/) |

## Session Continuity

Last session: 2026-03-04
Stopped at: Completed quick task 9 — Added sub-route interceptor and DOM scrape for financeMonthlyPayment/financeTermMonths in sunpitch.ts; graceful degradation preserved.
Resume file: None
