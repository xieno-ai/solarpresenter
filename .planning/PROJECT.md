# Solar Presenter

## What This Is

A web application for Northern NRG that generates polished, 11-page solar energy proposals matching their existing branded template design. It pulls data from SunPitch proposal URLs (via browser automation), offers AI-powered utility bill extraction as a helper function, supports manual number entry as a fallback, and outputs a full branded proposal as both a web-viewable page and a downloadable PDF.

## Core Value

Given a SunPitch URL or manually entered numbers, the app must produce a pixel-accurate, 11-page solar proposal PDF that matches the Northern NRG template — with all financial calculations computed correctly from the documented formulas.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] SunPitch URL scraping — paste a public SunPitch proposal URL, browser automation extracts all system data (system size, monthly production/consumption, rates, costs, financing terms, customer name/address, satellite image)
- [ ] Calculation engine — implements all formulas from the calculations document: utility cost projections (20/30-year with 5% annual increase), net metering (monthly grid buy/surplus, annual costs/revenue), carbon credits (CO2 avoided, Alberta benchmark schedule, payout estimates), cash back (3% on grid purchases), true savings (cash purchase), monthly all-in (finance option)
- [ ] Proposal generation — produces a full 11-page proposal matching the Northern NRG template design: (1) Cover page, (2) Table of contents, (3) Net Metering table, (4) Carbon Credits, (5) True All-In Costs (cash + finance), (6) Price History chart, (7) What's Coming, (8) Why Us, (9) Warranty, (10) FAQ, (11) Next Steps
- [ ] PDF download — generates a downloadable PDF that matches the web preview
- [ ] Web preview — proposal viewable in-browser before downloading
- [ ] Utility bill extractor — separate helper function: upload a bill (PDF, photo, scan), AI extracts electricity usage (monthly kWh preferred, annual kWh fallback, avg monthly bill last resort), utility company, energy rate, all-in rate (energy + T&D + riders, excluding GST), account holder, service address
- [ ] Manual entry mode — tab/popup where users enter raw numbers: system size, monthly production (12 months), monthly consumption (12 months), current rate, system cost, financing terms, customer name/address — app runs all calculations from formulas
- [ ] Static content sections — hardcoded marketing pages (Why Us, Warranty, FAQ, Price History, What's Coming, Next Steps) rendered identically on every proposal
- [ ] Northern NRG branding — green/dark green/gold color scheme, Northern NRG logo, specific typography and layout matching the template PDF

### Out of Scope

- Multi-company white-labeling — future licensing consideration, not v1
- SunPitch API integration — no official API; scraping public-facing URLs only
- CRM integration — no connection to sales pipeline or customer databases
- Email/sharing features — user downloads PDF and sends it themselves
- User accounts/authentication — single-user tool, no login required for v1
- Mobile-optimized interface — desktop-first for sales reps creating proposals

## Context

**Company:** Northern NRG — Alberta's most-installed solar company (16,000+ installs, 13+ years). Operates in Alberta, Canada.

**Current workflow:** Sales reps design systems in SunPitch (third-party tool), then manually create proposals. This tool automates the proposal generation step.

**SunPitch technical detail:** SunPitch (`app.sunpitch.com/facing/proposals/{uuid}`) is a JavaScript SPA. Public-facing proposal URLs require no authentication but need full browser rendering (Puppeteer/Playwright) to extract data. The page loads via JS — no static HTML content is served.

**Calculations:** All financial formulas are fully documented in a Word document (9 sections covering input data, utility projections, net metering, carbon credits, cash back, 20-year savings, 30-year savings, monthly finance analysis). Key assumptions:
- 5% annual electricity rate increase (Alberta historical average)
- Alberta grid emission factor: 0.55 t CO2/MWh
- Carbon credit payout: 45-65% of Alberta benchmark price
- Net metering buy rate: ~16.8¢/kWh (energy + T&D)
- Net metering sell rate: 33.5¢/kWh (summer surplus)
- 3% cash back on grid purchases

**Template:** 11-page branded PDF with specific design language — light blue backgrounds, green/gold/red accent colors, data tables, rate cards, marketing sections with icons and infographics. Pages 1-5 are dynamic (customer-specific numbers), pages 6-11 are static marketing/sales content.

**Bill extraction:** Detailed extraction prompt provided for AI-powered bill reading. Handles Alberta utility providers (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy). Extracts from PDFs, photos, scans. Prioritizes monthly kWh from bar graphs, falls back to annual kWh, then average monthly bill amount.

**Reference files:**
- Template PDF: `c:\Users\David\Downloads\Solar Template.pdf`
- Calculations doc: `c:\Users\David\Downloads\Solar_Proposal_Calculations.docx`
- Example SunPitch URL: `https://app.sunpitch.com/facing/proposals/db9b7ee9-349f-4047-a9f1-0b61610712a0`

## Constraints

- **Tech stack**: Web app (specific stack TBD via research) — needs browser automation capability for SunPitch scraping (Puppeteer/Playwright), AI/LLM integration for bill extraction, and PDF generation
- **SunPitch scraping**: Must handle JS-rendered SPA — no static HTML fallback available. Requires headless browser.
- **Alberta-specific**: All rates, carbon credit schedules, and utility providers are Alberta-specific. Formulas assume Alberta's deregulated electricity market.
- **Template fidelity**: Output must closely match the existing Northern NRG proposal PDF design — this is a sales document customers see.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser automation for SunPitch (not API) | SunPitch is a JS SPA with no public API; public-facing URLs are accessible without auth | — Pending |
| Bill extractor as separate helper function | Bill data feeds INTO SunPitch, not directly into proposal generation | — Pending |
| Static sections hardcoded | Why Us, Warranty, FAQ, Price History, What's Coming, Next Steps are identical for every customer | — Pending |
| No authentication for v1 | Single-company internal tool, no multi-user needs yet | — Pending |

---
*Last updated: 2026-03-02 after initialization*
