# Requirements: Solar Presenter

**Defined:** 2026-03-02
**Core Value:** Given a SunPitch URL or manually entered numbers, produce a pixel-accurate 11-page solar proposal PDF with all financial calculations computed correctly from documented formulas.

## v1 Requirements

### Data Input

- [ ] **INPUT-01**: User can paste a SunPitch proposal URL and the system extracts all data via headless browser (system size, monthly production/consumption, rates, costs, financing terms, customer name/address, satellite image)
- [x] **INPUT-02**: User can manually enter all proposal fields in a form (system size, 12-month production, 12-month consumption, current rate, system cost, financing terms, customer name/address)
- [ ] **INPUT-03**: Manual entry form pre-populates with scraped SunPitch data when available, all fields remain editable
- [ ] **INPUT-04**: User can upload a utility bill (PDF, photo, or scan) and AI extracts electricity usage, utility company, energy rate, all-in rate, account holder, and service address
- [ ] **INPUT-05**: Bill extraction outputs data in a structured format ready to input into SunPitch or populate the manual entry form
- [ ] **INPUT-06**: All numeric inputs are validated with range checks and cross-field validation (e.g., system size vs production consistency)
- [ ] **INPUT-07**: Missing or suspect data is clearly indicated with visual error states before proposal generation

### Calculations

- [ ] **CALC-01**: Utility cost projections for 20 and 30 years using 5% annual rate increase (geometric series formula)
- [ ] **CALC-02**: Monthly net metering analysis — grid buy and surplus sold for each of 12 months based on production vs consumption
- [ ] **CALC-03**: Annual grid purchase cost and annual sell revenue from net metering rates (buy rate ~16.8¢/kWh, sell rate 33.5¢/kWh)
- [ ] **CALC-04**: 20-year and 30-year net metering projections with 5% annual increase
- [ ] **CALC-05**: Carbon credit calculations — annual CO₂ avoided (Alberta grid factor 0.55 t/MWh), 10-year payout estimates using Alberta benchmark schedule (45-65% range)
- [ ] **CALC-06**: Cash-back calculation — 3% on all grid electricity purchases over 20 and 30 years
- [ ] **CALC-07**: True all-in savings (cash purchase) — utility avoided + net metering revenue + carbon credits + cash back − system cost
- [ ] **CALC-08**: Monthly finance analysis — finance payment + remaining utility − net metering revenue − carbon credits − cash back = monthly all-in cost
- [ ] **CALC-09**: All financial calculations use Decimal.js for precision (no IEEE 754 floating-point errors in 30-year projections)
- [ ] **CALC-10**: Alberta regulatory values (carbon benchmark prices, grid emission factor, rate assumptions) stored in a centralized configuration, not hardcoded in formulas

### Proposal Output

- [ ] **PROP-01**: Full 11-page branded proposal rendered as a web preview (scrollable, in-browser)
- [ ] **PROP-02**: Page 1 — Cover page with customer name, address, system size, solar offset %, 20-year utility cost, 20-year savings, satellite image
- [ ] **PROP-03**: Page 2 — Table of contents / roadmap with 9 numbered sections
- [ ] **PROP-04**: Page 3 — Net metering table with monthly breakdown (consume, produce, grid buy, surplus sold, cost to buy, revenue earned) plus rate cards
- [ ] **PROP-05**: Page 4 — Carbon credits section with annual CO₂ avoided, 10-year revenue estimate, Alberta benchmark price schedule table
- [ ] **PROP-06**: Page 5 — True all-in costs with cash purchase breakdown and finance option side-by-side, including 30-year savings note
- [ ] **PROP-07**: Pages 6-11 — Static marketing sections (Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps) rendered identically for every proposal
- [ ] **PROP-08**: PDF download that matches the web preview pixel-for-pixel
- [ ] **PROP-09**: Charts/graphs — utility cost projection trend, production vs consumption visualization
- [ ] **PROP-10**: Northern NRG branding throughout — green/dark green/gold color scheme, logo, specific typography matching template PDF

### Alberta Intelligence

- [ ] **RATE-01**: Built-in rate tables for major Alberta utility providers (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy)
- [ ] **RATE-02**: Provider auto-detection from uploaded utility bill when possible
- [ ] **RATE-03**: Rate configuration admin — easy to update when Alberta rates change (config file or simple UI)

### Sharing & Scenarios

- [ ] **SHARE-01**: Each generated proposal gets a unique shareable URL that customers can view in their browser
- [ ] **SHARE-02**: Cash vs finance toggle — user can switch between purchase scenarios without re-entering data, proposal updates in real-time

## v2 Requirements

### Versioning & Tracking

- **VER-01**: Proposal versioning / revision history when system design changes
- **TRACK-01**: Proposal view tracking (when customer opens, which sections they read)

### Platform Expansion

- **MULTI-01**: Multi-company white-labeling for licensing to other solar companies
- **LANG-01**: Multi-language support (English/French)
- **MOBILE-01**: Mobile-optimized proposal viewing experience

## Out of Scope

| Feature | Reason |
|---------|--------|
| Solar system design / panel layout | SunPitch handles this; separate product category |
| CRM / lead management | Not a sales pipeline tool |
| E-signature / contract signing | Conflates proposal with legal document |
| Financing marketplace / lender integration | Accept terms as input; don't connect to lenders |
| 3D visualization / interactive rendering | SunPitch provides this; extract static image only |
| User accounts / authentication | Single-company internal tool for v1 |
| Automated email/SMS sending | User downloads PDF and sends manually |
| Battery storage sizing | Accept from SunPitch if present; don't model independently |
| Permit documentation / plan sets | Engineering documents, not sales documents |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPUT-01 | Phase 6: SunPitch Scraping | Pending |
| INPUT-02 | Phase 2: Manual Entry | Complete |
| INPUT-03 | Phase 6: SunPitch Scraping | Pending |
| INPUT-04 | Phase 7: Bill Extraction | Pending |
| INPUT-05 | Phase 7: Bill Extraction | Pending |
| INPUT-06 | Phase 2: Manual Entry | Pending |
| INPUT-07 | Phase 2: Manual Entry | Pending |
| CALC-01 | Phase 3: Calculation Engine | Pending |
| CALC-02 | Phase 3: Calculation Engine | Pending |
| CALC-03 | Phase 3: Calculation Engine | Pending |
| CALC-04 | Phase 3: Calculation Engine | Pending |
| CALC-05 | Phase 3: Calculation Engine | Pending |
| CALC-06 | Phase 3: Calculation Engine | Pending |
| CALC-07 | Phase 3: Calculation Engine | Pending |
| CALC-08 | Phase 3: Calculation Engine | Pending |
| CALC-09 | Phase 1: Foundation & Data Schema | Pending |
| CALC-10 | Phase 1: Foundation & Data Schema | Pending |
| PROP-01 | Phase 4: Proposal Rendering | Pending |
| PROP-02 | Phase 4: Proposal Rendering | Pending |
| PROP-03 | Phase 4: Proposal Rendering | Pending |
| PROP-04 | Phase 4: Proposal Rendering | Pending |
| PROP-05 | Phase 4: Proposal Rendering | Pending |
| PROP-06 | Phase 4: Proposal Rendering | Pending |
| PROP-07 | Phase 4: Proposal Rendering | Pending |
| PROP-08 | Phase 5: PDF Generation | Pending |
| PROP-09 | Phase 4: Proposal Rendering | Pending |
| PROP-10 | Phase 4: Proposal Rendering | Pending |
| RATE-01 | Phase 8: Alberta Rate Intelligence | Pending |
| RATE-02 | Phase 8: Alberta Rate Intelligence | Pending |
| RATE-03 | Phase 8: Alberta Rate Intelligence | Pending |
| SHARE-01 | Phase 9: Sharing & Scenarios | Pending |
| SHARE-02 | Phase 9: Sharing & Scenarios | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
