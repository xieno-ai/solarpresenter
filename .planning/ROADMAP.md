# Roadmap: Solar Presenter

## Overview

Solar Presenter delivers a branded 11-page solar proposal generator for Northern NRG, built in nine phases following the natural dependency chain: foundation and data contracts first, then the manual-entry-to-calculation-to-rendering pipeline that forms the core product, followed by PDF export, external integrations (SunPitch scraping, AI bill extraction), Alberta-specific intelligence, and finally sharing capabilities. Each phase produces a usable checkpoint -- after Phase 4, a sales rep can manually enter data and see a complete branded proposal in-browser; after Phase 5, they can download it as a PDF; after Phase 6, they can paste a SunPitch URL and skip manual entry entirely.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Schema** - Next.js scaffold, TypeScript data contracts, Decimal.js integration, centralized Alberta config
- [x] **Phase 2: Manual Entry** - Input form with validation that defines the data schema every other input path conforms to (completed 2026-03-02)
- [x] **Phase 3: Calculation Engine** - All 8 financial formula sections verified against the reference spreadsheet
- [ ] **Phase 4: Proposal Rendering** - Complete 11-page branded proposal viewable in-browser with charts and Northern NRG design
- [ ] **Phase 5: PDF Generation** - Playwright-based PDF export matching the web preview pixel-for-pixel
- [ ] **Phase 6: SunPitch Scraping** - Headless browser extraction from SunPitch proposal URLs with graceful fallback
- [ ] **Phase 7: Bill Extraction** - AI-powered utility bill reading that pre-fills the manual entry form
- [ ] **Phase 8: Alberta Rate Intelligence** - Built-in rate tables for major Alberta utility providers with admin configuration
- [ ] **Phase 9: Sharing & Scenarios** - Shareable proposal URLs and cash vs finance toggle

## Phase Details

### Phase 1: Foundation & Data Schema
**Goal**: Establish the project scaffold with TypeScript data contracts, precision arithmetic, and centralized Alberta configuration so that all subsequent phases build on verified foundations
**Depends on**: Nothing (first phase)
**Requirements**: CALC-09, CALC-10
**Success Criteria** (what must be TRUE):
  1. A Next.js application runs locally with a working dev server and the project structure matches the architecture (input layer, calculation engine, proposal renderer, API routes)
  2. `ProposalInputs` and `ProposalOutputs` TypeScript types are defined and importable from a shared module -- they represent the complete data contract for the proposal pipeline
  3. All monetary arithmetic uses Decimal.js -- native JavaScript `Number` is never used for financial values anywhere in the codebase
  4. Alberta regulatory values (carbon benchmark prices, grid emission factor, net metering rates, escalation assumptions) are stored in a single centralized configuration file with effective dates, not hardcoded in any formula or component
  5. A trivial end-to-end smoke test passes: hardcoded test inputs flow through a stub calculation function and render a placeholder page in the browser
**Plans**: 2

Plans:
- [x] 01-01-PLAN.md -- Next.js scaffold, TypeScript data contracts, Decimal.js utilities, Paul Friesen test fixture
- [x] 01-02-PLAN.md -- Supabase schema, Alberta config data layer, smoke test page

### Phase 2: Manual Entry
**Goal**: Users can enter all proposal input fields in a validated form that serves as the always-works fallback and defines the data schema every other input path must conform to
**Depends on**: Phase 1
**Requirements**: INPUT-02, INPUT-06, INPUT-07
**Success Criteria** (what must be TRUE):
  1. User can fill out a form with all proposal fields: system size, 12-month production, 12-month consumption, current rate, system cost, financing terms, customer name, and customer address
  2. All numeric inputs are validated with range checks (e.g., system size 1-100 kW, monthly kWh 0-5000) and invalid values show clear inline error messages
  3. Cross-field validation catches inconsistencies (e.g., system size vs total production mismatch) and displays warnings before the user can proceed to proposal generation
  4. Missing required fields are visually indicated with error states, and the "Generate Proposal" action is disabled until all required fields are valid
**Plans**: 3

Plans:
- [x] 02-01-PLAN.md -- Form lib layer (Zod schema, Alberta solar curve, localStorage persistence, server action for rate defaults)
- [x] 02-02-PLAN.md -- Form components (FormInput, SectionCard, GenerateFooter, MonthlyGrid with two-way sync)
- [x] 02-03-PLAN.md -- Form page assembly at /enter + human verification

### Phase 3: Calculation Engine
**Goal**: All financial calculations produce verified results matching the reference spreadsheet, transforming manual entry inputs into complete proposal output data
**Depends on**: Phase 2
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08
**Success Criteria** (what must be TRUE):
  1. Utility cost projections for 20-year and 30-year horizons using 5% annual rate increase match the reference spreadsheet values (geometric series formula)
  2. Monthly net metering analysis correctly computes grid buy and surplus sold for each of 12 months, and annual grid purchase cost and sell revenue match expected values at buy rate ~16.8c/kWh and sell rate 33.5c/kWh
  3. Carbon credit calculations produce correct annual CO2 avoided using Alberta grid factor 0.55 t/MWh, and 10-year payout estimates using the Alberta benchmark schedule fall within the 45-65% range
  4. True all-in savings (cash purchase) and monthly finance analysis produce results matching the reference spreadsheet -- including cash-back at 3% on grid purchases over 20 and 30 years
  5. All calculation functions are pure (inputs in, outputs out, no side effects) and unit-tested against known reference values from the calculations document
**Plans**: 3

Plans:
- [x] 03-01-PLAN.md -- AlbertaConfig test fixture + 5 domain sub-modules (utility-projection, net-metering, carbon-credits, cash-back, savings)
- [x] 03-02-PLAN.md -- calculateProposal() public API assembly + complete Vitest test suite (TDD, all CALC-* requirements)
- [x] 03-03-PLAN.md -- Server action (runCalculation) + /enter page wired to real output + human verification

### Phase 4: Proposal Rendering
**Goal**: Users can see a complete, branded 11-page solar proposal in-browser that matches the Northern NRG template design, with all dynamic pages populated from calculated data and all static marketing pages rendered identically
**Depends on**: Phase 3
**Requirements**: PROP-01, PROP-02, PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-09, PROP-10
**Success Criteria** (what must be TRUE):
  1. User can view a scrollable 11-page proposal in-browser after entering data and triggering generation -- all 11 pages render in sequence as a continuous document
  2. Pages 1-5 display correct customer-specific data: cover page (name, address, system size, solar offset, 20-year utility cost, 20-year savings, satellite image placeholder), table of contents, net metering table with monthly breakdown, carbon credits with benchmark schedule, and true all-in costs with cash and finance side-by-side
  3. Pages 6-11 render static marketing content (Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps) identically for every proposal regardless of input data
  4. Charts and visualizations render correctly: utility cost projection trend line and production vs consumption comparison are visible and data-accurate
  5. Northern NRG branding is applied throughout: green/dark green/gold color scheme, logo placement, typography, and layout match the template PDF
**Plans**: 4

Plans:
- [x] 04-01-PLAN.md -- URL encoding utility, NRG CSS theme, fonts (Bebas Neue + Montserrat), /proposal server component shell, /enter Generate button navigation
- [x] 04-02-PLAN.md -- Dynamic pages 1, 3, 4, 5 (Cover, Net Metering, Carbon Credits, All-In Costs) + Recharts charts (utility trend + production/consumption)
- [x] 04-03-PLAN.md -- Table of Contents (Page 2) + static marketing pages 6-11 (Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps) + full 11-page assembly
- [x] 04-04-PLAN.md -- Human verification: all 11 pages reviewed and redesigned pixel-for-perfect against Northern NRG reference images

### Phase 5: PDF Generation
**Goal**: Users can download a PDF of the proposal that matches the web preview, completing the core product workflow from data entry to deliverable sales document
**Depends on**: Phase 4
**Requirements**: PROP-08
**Success Criteria** (what must be TRUE):
  1. User can click a "Download PDF" button and receive an 11-page PDF file within 15 seconds
  2. The downloaded PDF matches the web preview pixel-for-pixel -- same layout, colors, fonts, charts, images, and page breaks
  3. PDF file size is under 5 MB for a typical proposal (with satellite image placeholder)
  4. Page breaks fall cleanly between proposal sections -- no table rows split mid-row, no headings orphaned from their content
**Plans**: 2

Plans:
- [x] 05-01-PLAN.md -- /proposal/pdf render target + pdf.css page breaks + /api/pdf Playwright route handler + ProposalFAB Download PDF action
- [ ] 05-02-PLAN.md -- Human verification: PDF downloads correctly with 11 pages, correct colors/fonts/charts, under 5 MB

### Phase 6: SunPitch Scraping
**Goal**: Users can paste a SunPitch proposal URL and have all input fields auto-populated, eliminating manual data entry for the primary sales workflow
**Depends on**: Phase 2
**Requirements**: INPUT-01, INPUT-03
**Success Criteria** (what must be TRUE):
  1. User can paste a SunPitch proposal URL (app.sunpitch.com/facing/proposals/{uuid}) and see a progress indicator while data is being extracted
  2. All proposal fields are populated from the scraped data: system size, monthly production, monthly consumption, rates, costs, financing terms, customer name/address, and satellite image
  3. Scraped data pre-populates the manual entry form with all fields remaining editable -- the user can review and correct any value before generating the proposal
  4. When scraping fails (timeout, DOM changes, invalid URL), the user sees a clear error message and can fall back to manual entry without losing any data they already entered
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Bill Extraction
**Goal**: Users can upload a utility bill and have consumption and rate data extracted by AI, pre-filling relevant fields in the manual entry form with human confirmation
**Depends on**: Phase 2
**Requirements**: INPUT-04, INPUT-05
**Success Criteria** (what must be TRUE):
  1. User can upload a utility bill as a PDF, photo (JPG/PNG), or scan, and see extracted data within 10 seconds
  2. Extracted fields include electricity usage (monthly kWh preferred, annual kWh fallback, avg monthly bill last resort), utility company, energy rate, all-in rate, account holder, and service address
  3. Extracted data is presented for human review and confirmation before being committed to any form field -- never auto-submitted to calculations
  4. Confirmed extraction data pre-fills the corresponding manual entry form fields, and any field the user previously entered manually is preserved unless the user explicitly accepts the extracted value
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Alberta Rate Intelligence
**Goal**: The system has built-in knowledge of Alberta utility provider rate structures, reducing the "wrong rate" error class and enabling provider-aware defaults
**Depends on**: Phase 2
**Requirements**: RATE-01, RATE-02, RATE-03
**Success Criteria** (what must be TRUE):
  1. Built-in rate tables exist for all five major Alberta providers (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy) and selecting a provider auto-fills the energy rate and all-in rate fields with current values
  2. When a utility bill is uploaded and the provider is identifiable, the provider is auto-detected and the corresponding rate table is suggested to the user
  3. An admin configuration interface (config file or simple UI) allows updating rate values when Alberta rates change, without modifying application code
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Sharing & Scenarios
**Goal**: Generated proposals are shareable via unique URLs and support toggling between cash and finance purchase scenarios without re-entering data
**Depends on**: Phase 5
**Requirements**: SHARE-01, SHARE-02
**Success Criteria** (what must be TRUE):
  1. Each generated proposal receives a unique URL that a customer can open in their browser and view the full proposal without any login or special access
  2. A cash vs finance toggle is available on the proposal view that switches between purchase scenarios in real-time, updating all relevant financial figures without requiring the user to re-enter data or regenerate the proposal
  3. Shared proposal URLs remain accessible for a reasonable retention period (at least 30 days) and display the proposal as it was generated
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
Note: Phases 6, 7, and 8 all depend on Phase 2 (not on each other), so they could theoretically execute in parallel after Phase 5 completes the core pipeline. However, the recommended order prioritizes the primary sales workflow (SunPitch scraping) over convenience features.

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation & Data Schema | 2/2 | Complete | 2026-03-02 |
| 2. Manual Entry | 3/3 | Complete   | 2026-03-02 |
| 3. Calculation Engine | 3/3 | Complete | 2026-03-03 |
| 4. Proposal Rendering | 4/4 | Complete | 2026-03-03 |
| 5. PDF Generation | 1/2 | In progress | - |
| 6. SunPitch Scraping | 0/TBD | Not started | - |
| 7. Bill Extraction | 0/TBD | Not started | - |
| 8. Alberta Rate Intelligence | 0/TBD | Not started | - |
| 9. Sharing & Scenarios | 0/TBD | Not started | - |
