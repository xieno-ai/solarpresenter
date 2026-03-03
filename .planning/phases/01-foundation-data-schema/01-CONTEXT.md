# Phase 1: Foundation & Data Schema - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the Next.js project scaffold with TypeScript data contracts, Decimal.js precision arithmetic, Supabase database, and centralized Alberta configuration. All subsequent phases build on these foundations. No UI, no forms, no calculations beyond a stub smoke test.

</domain>

<decisions>
## Implementation Decisions

### Data Contract Shape
- Claude's discretion on grouping (nested vs flat) — pick whatever works best for the pipeline
- Monthly data: 12 individual monthly values for both production and consumption are the canonical format
  - SunPitch provides monthly values directly
  - Manual entry accepts either 12 monthly values OR a single annual total (distributed via Alberta solar curve)
  - Bill extraction attempts monthly from consumption graph if available, annual fallback
- Equipment details (module model, inverter brand) are NOT part of the data contract — they don't appear in the proposal output
- Only data that appears in the 11-page proposal PDF is needed in the contract

### Input Fields (from SunPitch extraction + calculations doc)
**Customer:**
- Name, address, lat/long (for satellite image)

**System:**
- System size (kW), annual production (kWh), 12 monthly production values

**Consumption:**
- Annual consumption (kWh), 12 monthly consumption values, annual electricity cost

**Rates (4 values):**
- All-in rate (e.g., 35.10c/kWh) — used to derive consumption and display on page 3
- Net metering buy rate (e.g., 16.80c/kWh) — energy + T&D, used in grid purchase calculations
- Net metering sell rate (e.g., 33.50c/kWh) — summer surplus sell-back
- Annual escalation rate (default from config, overridable per proposal — e.g., 5% or 7%)
- Pre-Solar Rate and LO Rate shown on page 3 are display-only, not calculation inputs

**Cost & Financing:**
- Cash purchase price, finance monthly payment, finance term (months), finance interest rate

### Carbon Credits
- We calculate carbon credits ourselves using the formula from the calculations doc
- No need to enter SolarOffset.ca quotes — system computes: CO2 = (production/1000) x grid_factor, payouts = CO2 x benchmark x payout_percentage
- The 45-65% payout range and scaling methodology are implemented in code using config values

### Database
- Supabase from Phase 1 — not deferred
- Tables needed: Alberta config (with effective dates + version history), proposals (for Phase 9 shareable URLs)
- Set up Supabase project and schema as part of foundation work

### Alberta Config Structure
- ALL regulatory/configurable values live in Supabase, not hardcoded:
  - Carbon benchmark schedule (year, price per tonne) with effective dates
  - Grid emission factor (0.55 t/MWh)
  - Payout percentage range (45-65%)
  - Cash back rate (3%)
  - Default annual escalation rate (5%)
  - Net metering rates (buy/sell defaults)
- Version history with effective dates — older proposals show the rates that were valid when generated
- Admin UI for editing is Phase 8, but the data layer and schema are Phase 1

### Project Stack
- Next.js with App Router (Claude picks modern best practices)
- Tailwind CSS
- npm as package manager
- Vercel deployment target
- Supabase for database
- Decimal.js for all financial arithmetic
- Claude decides styling framework, component patterns, and project structure

### Smoke Test
- Use Paul Friesen data from the calculations doc as hardcoded test inputs
- This becomes the verified reference case for Phase 3 calculation testing
- Claude decides the level of visual output (JSON dump vs minimal formatted display)

### Claude's Discretion
- Data contract grouping structure (nested objects vs flat)
- Next.js project structure and file organization
- Component library choices
- Smoke test visual fidelity
- Supabase schema design details
- Which Tailwind plugins/config

</decisions>

<specifics>
## Specific Ideas

- The calculations doc (Solar_Proposal_Calculations.docx) is the authoritative reference for ALL formulas — 8 sections covering input verification, utility projections, net metering, carbon credits, cash back, 20-year savings, 30-year savings, and monthly finance analysis
- The PDF template (Solar Template.pdf) shows the exact 11-page output: 5 dynamic pages (cover, TOC, net metering, carbon credits, true all-in costs) + 6 static marketing pages
- SunPitch data was successfully extracted via Playwright — the extraction script and complete data map are available in `scripts/extract-sunpitch.mjs`
- Reference page images exported to `reference/page-01.png` through `reference/page-11.png`
- Brand assets will be provided separately by the user (logo files, hex colors, font names)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-data-schema*
*Context gathered: 2026-03-02*
