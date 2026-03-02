# Feature Landscape

**Domain:** Solar Proposal Generation Software (single-company, Alberta-focused)
**Researched:** 2026-03-02
**Mode:** Ecosystem survey focused on features dimension
**Overall Confidence:** MEDIUM-HIGH (cross-referenced across multiple competitor platforms, industry guides, and Alberta-specific sources)

---

## Context: Where This Tool Sits in the Landscape

The solar proposal software market is dominated by full-stack platforms (Aurora Solar, OpenSolar, Solargraf, Enerflo) that handle everything from system design through to contract signing. Northern NRG's tool is deliberately scoped differently: SunPitch handles system design, and this tool focuses exclusively on **proposal generation** -- turning system data and financial inputs into a polished, branded 11-page document with correct Alberta-specific calculations.

This distinction is critical for feature categorization. Many "table stakes" features in the broader market (3D design, shade analysis, panel layout) are explicitly out of scope here because SunPitch already does them. Our table stakes are about **proposal output quality, calculation accuracy, and data input reliability**.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or unusable.

### Data Input & Extraction

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| SunPitch URL scraping | Core data source -- this is how reps work today; paste URL, get system data | High | JS SPA requires headless browser (Playwright/Puppeteer). Must extract: system size, monthly production/consumption, rates, costs, financing terms, customer name/address, satellite image. This is a fragile dependency -- SunPitch HTML structure can change without notice. |
| Manual data entry form | Fallback when scraping fails or data needs correction; also enables use without SunPitch | Medium | Tab/popup with fields: system size, 12-month production, 12-month consumption, current rate, system cost, financing terms, customer name/address. Must pre-populate from scraping results when available. |
| Utility bill AI extraction | Sales reps expect to photograph/scan a bill and have data extracted automatically; every major competitor offers OCR/AI bill reading | High | Must handle Alberta providers (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy). Extract: monthly kWh, utility company, energy rate, all-in rate, account holder, service address. AI/LLM-powered, not traditional OCR. |
| Data validation & error handling | Bad data in = bad proposal out; users must see clear errors before generating | Low | Range checks on all numeric inputs, cross-validation between fields (e.g., system size vs production), visual indicators for missing/suspect data. |

**Confidence:** HIGH -- directly from PROJECT.md requirements and confirmed as standard across Aurora, OpenSolar, Solargraf, Enerflo.

### Financial Calculations

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Utility cost projections (20-year and 30-year) | Every competitor shows long-term cost projections; this is the core "why go solar" argument | Medium | 5% annual rate escalation (Alberta historical average). Must show year-by-year table with cumulative costs. Industry standard is 25-year horizon but Northern NRG uses 20 and 30. |
| Net metering calculations | Alberta's net billing/metering is a primary financial benefit; proposals must quantify it accurately | High | Monthly grid buy/surplus calculations, annual costs/revenue. Alberta-specific: retail rate compensation (~16.8c/kWh buy, 33.5c/kWh summer surplus sell). Must handle 12-month production vs consumption comparison. |
| Carbon credit calculations | Alberta-specific benefit via SolarOffset.ca; distinguishes Alberta proposals from generic solar proposals | Medium | CO2 avoided (Alberta grid emission factor 0.55 t CO2/MWh), Alberta carbon benchmark schedule, payout estimates (45-65% of benchmark). Up to 10 years of credits. |
| Cash-back calculation | 3% on grid purchases -- Northern NRG specific benefit | Low | Straightforward percentage calculation on grid purchase amounts. |
| True all-in savings (cash purchase) | Core "bottom line" number homeowners care about most | Medium | Combines utility savings, net metering revenue, carbon credits, and cash-back over the system lifetime vs system cost. |
| Monthly finance analysis | Many customers finance; they need to see monthly payment vs monthly savings side-by-side | Medium | Monthly payment amount, monthly savings, net cost/benefit per month. Must show how solar payment compares to current electricity bill. |
| System payback period | Industry standard metric -- every competitor highlights this prominently | Low | Derived from other calculations. Time until cumulative savings exceed system cost. |

**Confidence:** HIGH -- all calculations are documented in the Northern NRG calculations document. Confirmed as industry standard through Aurora Solar, OpenSolar, SurgePV, and multiple proposal guides.

### Proposal Document Generation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Branded 11-page proposal output | This IS the product -- must match Northern NRG template design closely | High | Pages: (1) Cover, (2) TOC, (3) Net Metering table, (4) Carbon Credits, (5) True All-In Costs, (6) Price History, (7) What's Coming, (8) Why Us, (9) Warranty, (10) FAQ, (11) Next Steps. Pages 1-5 dynamic, 6-11 static. |
| PDF download | Sales reps email PDFs to customers -- this is the primary delivery mechanism | High | Must be pixel-accurate to the web preview. PDF generation from web content is notoriously tricky for layout fidelity. |
| Web preview | Reps need to review before downloading; also enables screen-sharing during sales calls | Medium | In-browser rendering of the full 11-page proposal with scroll/navigation. Must match PDF output exactly. |
| Customer-specific dynamic data | Pages 1-5 must reflect the actual customer's system, production, consumption, and financials | Medium | Template engine that populates customer name, address, system specs, all calculated values into the branded template. |
| Static marketing sections | Pages 6-11 are identical for every proposal -- hardcoded content that marketing controls | Low | Why Us, Warranty, FAQ, Price History, What's Coming, Next Steps. Content changes infrequently, managed by the business. |

**Confidence:** HIGH -- directly from PROJECT.md and the existing Northern NRG template PDF.

### Visual & Design Elements

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Northern NRG branding | This is a customer-facing sales document; must look professional and on-brand | Medium | Green/dark green/gold color scheme, Northern NRG logo, specific typography matching template PDF. |
| Data tables | Financial projections must be presented in clear, scannable tables | Medium | Net metering monthly breakdown, year-over-year cost projections, carbon credit schedules. Must handle 12-month and 20/30-year data sets. |
| Charts/graphs | Visual representation of savings over time is expected in every modern solar proposal | Medium | At minimum: utility cost projection chart (rising line), savings comparison chart. Industry standard includes bar charts for monthly production/consumption. |
| Satellite/roof image | Customer expects to see their house in the proposal -- SunPitch provides this | Low | Extract from SunPitch and embed in cover page or system overview. Low complexity because SunPitch provides the image; we just need to extract and place it. |

**Confidence:** HIGH -- confirmed across Aurora, OpenSolar, Solargraf, and every proposal template guide reviewed.

---

## Differentiators

Features that set the product apart. Not expected by users in a custom internal tool, but add significant value.

### High-Value Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Alberta-specific rate intelligence | Hardcoded knowledge of Alberta utility providers, rate structures, T&D charges, and riders -- eliminates the "wrong rate" problem that plagues national tools | Medium | The #3 most common solar proposal mistake is using incorrect utility rates. By building in Alberta provider-specific rate tables (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy), we eliminate this error class entirely. Could include auto-detection of provider from utility bill. |
| Carbon credit integration with SolarOffset.ca schedule | Most generic proposal tools ignore Canadian carbon credits entirely; this quantifies a real Alberta-specific financial benefit that competitors miss | Medium | Uses Alberta's published carbon benchmark price schedule to project 10 years of carbon credit revenue. This is a genuinely unique selling point in proposals -- many Alberta solar companies either omit this or hand-calculate it. |
| One-click proposal from SunPitch URL | Paste URL, get complete proposal -- dramatically faster than any competitor workflow which requires manual system design | Medium | While the scraping is table-stakes for this specific tool, the speed and simplicity of "paste URL -> get proposal" is a genuine workflow differentiator vs. the industry norm of designing systems from scratch in the proposal tool. |
| Dual-horizon projections (20 and 30 year) | Most tools show 25-year only; showing both 20 and 30 gives customers flexibility to see near-term and long-term value | Low | Minor calculation extension but impactful for customer conversations. Sales rep can emphasize whichever horizon resonates with the customer's planning horizon. |

### Medium-Value Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Shareable proposal URL | Instead of only emailing PDFs, generate a unique URL where the customer can view their proposal online in a web browser -- tracks if/when they view it | Medium | Aurora and OpenSolar both offer this. Not expected from a custom internal tool, but enables: (1) sharing via text message, (2) customer can zoom/interact, (3) optional view tracking. Could be v2 feature. |
| Proposal versioning / revision history | When a system design changes, generate a new revision and track what changed | Medium | Useful when sales cycle involves multiple iterations. Not critical for v1 but prevents "which PDF was the latest?" confusion. |
| Print-optimized CSS | Proposal renders correctly when customer hits Ctrl+P from the web preview | Low | Surprisingly valuable -- many customers print proposals for their spouse/partner to review. CSS @media print rules can handle this without a separate PDF step. |
| Pre-populated scenarios | Offer quick toggles between cash purchase vs financed, or between system sizes, without re-entering all data | High | Would need calculation engine to support multiple simultaneous parameter sets and comparison views. High value for the sales conversation but complex to implement well. |

### Lower-Value Differentiators (Post-MVP)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-language support (English/French) | Alberta has French-speaking communities; bilingual proposals could open new markets | High | Would require full content translation and locale-aware formatting. Not a priority for v1. |
| Proposal analytics (view tracking, time-on-page) | Know when the customer opens the proposal and which sections they spend time on -- helps sales reps time their follow-up | Medium | Requires shareable URL feature first. Useful but not critical for an internal tool where reps have direct customer relationships. |
| Dark mode / theme variants | Alternative proposal designs for different contexts or seasons | Medium | Nice-to-have but Northern NRG branding is fixed. More relevant if white-labeling is added later. |

**Confidence:** MEDIUM -- differentiation assessment based on cross-referencing competitor capabilities with Northern NRG's specific Alberta context and workflow.

---

## Anti-Features

Features to explicitly NOT build. Common in competitors but wrong for this tool's scope.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Solar system design / panel layout tool** | SunPitch handles system design. Building a competing design tool duplicates work, adds massive complexity, and creates maintenance burden for shade analysis, LIDAR data, panel placement algorithms. Aurora Solar spent hundreds of millions building theirs. | Scrape the completed design from SunPitch. If scraping fails, accept manual input of the design outputs (system size, production numbers). |
| **CRM / lead management / pipeline tracking** | Northern NRG is a single-company tool with no login required for v1. CRM features add complexity without value for the immediate use case. Enerflo, Solo, and SolarNexus compete here -- let them. | Focus on proposal generation only. Reps manage their pipeline in whatever tool they already use. |
| **E-signature / contract signing** | Adds legal compliance burden (electronic signature laws vary), requires secure document storage, and conflates proposal (sales tool) with contract (legal document). OpenSolar and Aurora handle this, but it is a different product category. | Generate a PDF that the rep emails. Contract signing happens in whatever process Northern NRG already uses. |
| **Financing marketplace / lender integration** | Connecting to multiple financing providers (GoodLeap, Mosaic, Dividend, etc.) is an enormous integration effort. Northern NRG has specific financing partners already. | Accept financing terms as input (rate, term, down payment). Calculate monthly payments from those inputs. The rep enters the terms their financing partner quoted. |
| **Real-time utility rate API integration** | Live rate lookups require maintaining API integrations with Alberta utilities that may not exist or may be unreliable. Rate changes are infrequent (quarterly at most). | Hardcode current Alberta rates with an easy admin override. Update rates when they change (manually or via a simple config file). Far more reliable than API calls. |
| **3D visualization / interactive roof rendering** | GPU-intensive, requires complex 3D libraries, and SunPitch already provides this to the customer during the design phase. Attempting to recreate it would be a poor imitation. | Extract the satellite image from SunPitch and embed it as a static image in the proposal. The customer has already seen the 3D rendering in SunPitch. |
| **Mobile-first responsive design** | Reps create proposals on desktop computers. Optimizing for mobile adds design complexity for a use case that does not exist. The PDF output handles mobile viewing (customers open PDFs on phones). | Build for desktop. Web preview should work acceptably on tablets but does not need phone optimization. If customers view a shared URL on mobile, the PDF download solves this. |
| **User accounts / multi-tenancy / authentication** | v1 is a single-company internal tool. Adding auth, user management, and permissions is premature complexity. | No login required. If security is needed later, put it behind a simple shared password or company VPN. |
| **Automated email / SMS sending** | Conflates proposal generation with marketing automation. Reps know their customers and prefer to control messaging. | Rep downloads PDF and sends it themselves via their preferred channel. This is explicitly stated as out of scope in PROJECT.md. |
| **Battery storage sizing / modeling** | Complex calculation domain (hourly state-of-charge simulation, time-of-use arbitrage). Aurora and OpenSolar spend significant resources on this. | If SunPitch includes battery in the system design, scrape the battery specs and include them in the proposal. Do not attempt independent battery sizing. |
| **Permit documentation / plan sets / interconnection forms** | These are engineering documents with specific AHJ requirements, not sales documents. Different product category entirely. | Not even adjacent to our scope. The proposal is a sales tool, not a permitting package. |

**Confidence:** HIGH -- anti-features derived directly from PROJECT.md's "Out of Scope" section and validated against the competitive landscape to confirm these are genuinely separate product categories.

---

## Feature Dependencies

```
Data Input Layer (must exist first)
  |
  +-- SunPitch URL Scraping
  |     |
  |     +-- Extracts: system size, production, consumption, rates, costs,
  |     |             financing terms, customer info, satellite image
  |     |
  |     +-- Populates -> Manual Entry Form (pre-filled, editable)
  |
  +-- Manual Entry Form
  |     |
  |     +-- All fields manually editable regardless of data source
  |     +-- Validation rules on all numeric inputs
  |
  +-- Utility Bill AI Extraction (helper function)
        |
        +-- Extracts: kWh usage, utility provider, rates, customer info
        +-- NOTE: Bill data feeds INTO SunPitch designs (upstream), not
        |         directly into proposal generation
        +-- But can also populate Manual Entry Form fields directly

Calculation Engine (depends on validated input data)
  |
  +-- Utility Cost Projections (20yr, 30yr)
  |     +-- Depends on: current rate, 5% escalation assumption
  |
  +-- Net Metering Analysis
  |     +-- Depends on: 12-month production, 12-month consumption,
  |     |               buy rate, sell rate
  |     +-- Produces: monthly grid buy/surplus, annual costs/revenue
  |
  +-- Carbon Credit Calculations
  |     +-- Depends on: system production, Alberta emission factor,
  |     |               carbon benchmark schedule
  |     +-- Produces: CO2 avoided, annual credit payout estimates
  |
  +-- Cash Back Calculation
  |     +-- Depends on: grid purchase amounts from Net Metering
  |
  +-- True Savings (Cash Purchase)
  |     +-- Depends on: ALL above calculations + system cost
  |
  +-- Monthly Finance Analysis
        +-- Depends on: True Savings + financing terms (rate, term, down)

Proposal Generation (depends on calculation engine output)
  |
  +-- Template Engine
  |     +-- Populates customer data + calculated values into 11-page template
  |     +-- Renders static marketing pages (6-11) unchanged
  |
  +-- Web Preview
  |     +-- Renders proposal in-browser
  |     +-- Must match PDF output precisely
  |
  +-- PDF Generation
        +-- Depends on: Web Preview (generates PDF from rendered HTML/CSS)
        +-- Must produce downloadable file matching web preview
```

### Critical Path

The critical dependency chain is:

1. **Data Input** (any source) -> validated input data
2. **Calculation Engine** -> all financial results
3. **Template Rendering** -> proposal web preview
4. **PDF Generation** -> downloadable output

Each layer depends strictly on the previous one. The utility bill extractor is a parallel helper that feeds into the data input layer but is not on the critical path for proposal generation.

---

## MVP Recommendation

### Must Have for MVP (ordered by dependency)

1. **Manual data entry form** -- the guaranteed fallback that works regardless of scraping status. Start here because it defines the data schema everything else depends on.
2. **Calculation engine** -- all financial formulas from the documented calculations. This is the intellectual core of the product and must be correct.
3. **Proposal template rendering (web preview)** -- the 11-page branded template with dynamic data on pages 1-5 and static content on pages 6-11.
4. **PDF download** -- the actual deliverable the sales rep gives to the customer.
5. **SunPitch URL scraping** -- automates data entry but is not required for the tool to function.

### Should Have for MVP (high value, reasonable effort)

6. **Utility bill AI extraction** -- specified as a "separate helper function" in PROJECT.md. Include in MVP if time permits, but the tool works without it (reps can manually enter data from bills).
7. **Data validation and error handling** -- prevents bad proposals from being generated.
8. **Charts and visualizations** -- utility cost projection chart and production/consumption comparison. Elevates the proposal from "data tables" to "professional sales document."

### Defer to Post-MVP

- **Shareable proposal URLs** -- requires backend infrastructure for hosting proposals
- **Proposal versioning** -- useful but adds state management complexity
- **Pre-populated scenarios (cash vs finance toggle)** -- high value but high complexity
- **Proposal analytics / view tracking** -- requires shareable URLs first
- **Multi-language support** -- large effort, small audience
- **Alberta rate auto-detection from utility provider** -- nice polish, not critical

### Rationale

The ordering prioritizes the **data -> calculation -> render -> output** pipeline. Manual entry comes before SunPitch scraping because (a) it defines the data schema, (b) it always works, and (c) scraping is inherently fragile (SunPitch can change their HTML at any time). The calculation engine comes next because it must be verified for correctness before any template work begins -- wrong numbers in a beautiful template is worse than right numbers in a plain page.

---

## Sources

### Competitor Platforms (multiple sources per platform)
- [Aurora Solar Feature Review (SurgePV)](https://www.surgepv.com/reviews/aurora-solar) -- MEDIUM confidence
- [Aurora Solar Proposal Help Center](https://help.aurorasolar.com/hc/en-us/categories/12124059708435-Proposals-Documents) -- HIGH confidence (official docs)
- [Aurora Solar Blog: How to Write Great Proposals](https://aurorasolar.com/blog/how-to-write-great-solar-sales-proposals/) -- HIGH confidence (official blog)
- [OpenSolar Proposals](https://www.opensolar.com/proposals/) -- MEDIUM confidence
- [OpenSolar E-Signature & Payments](https://www.opensolar.com/e-signature-payments/) -- MEDIUM confidence
- [Enerflo Sales Process Features](https://enerflo.com/features/sales-process) -- MEDIUM confidence
- [OpusFlow Solar Proposal Software Comparison](https://opusflow.io/blog/solar/solar-proposal-software/) -- MEDIUM confidence

### Industry Guides & Best Practices
- [SurgePV: Top 7 Solar Proposal Platforms 2025](https://www.surgepv.com/best-solar-software/proposal) -- MEDIUM confidence
- [EasySolar: Comparing 5 Leading Options](https://easysolar.app/en/comparing-5-leading-solar-proposal-software-options/) -- MEDIUM confidence
- [Qwilr: How to Write a Solar Proposal](https://qwilr.com/blog/how-to-write-a-solar-proposal/) -- MEDIUM confidence
- [Solargraf: 7 Key Components for Solar Proposals](https://www.solargraf.com/blog/things-include-solar-proposal/) -- MEDIUM confidence
- [GreenLancer: What to Include in a Solar Proposal](https://www.greenlancer.com/post/include-in-solar-panel-proposal) -- MEDIUM confidence
- [Aquion Energy: Professional Solar Proposals](https://www.aquionenergy.com/how-to-create-professional-solar-proposals/) -- MEDIUM confidence

### Alberta-Specific Sources
- [Alberta Micro-Generation (UCA Helps)](https://ucahelps.alberta.ca/Micro-Generation-in-Alberta.aspx) -- HIGH confidence (government source)
- [Alberta Net Billing Guide (Alberta Solar Advisors)](https://alberta-solar.org/incentives/net-billing/) -- MEDIUM confidence
- [SolarOffset.ca Carbon Credits](https://www.solaroffset.ca/) -- HIGH confidence (the specific platform referenced in PROJECT.md)
- [Rewatt Power: Alberta Carbon Credit Calculation Steps](https://rewattpower.com/4-steps-calculate-earnings-alberta-carbon-credits/) -- MEDIUM confidence
- [MagSolar: Comprehensive Guide to Solar in Alberta](https://magsolar.ca/comprehensive-guide-to-going-solar-in-alberta/) -- MEDIUM confidence

### Proposal Mistakes & What to Watch For
- [SalesRabbit: 8 Common Problems of Solar Proposals](https://salesrabbit.com/insights/8-common-problems-of-solar-proposals-how-to-fix-them/) -- MEDIUM confidence
- [Southern Energy: 12 Items to Watch Out For](https://southern-energy.com/solar-proposal-checklist/) -- MEDIUM confidence
- [NREL: Seven Common Mistakes Solar Installers Make](https://www.nrel.gov/solar/market-research-analysis/solar-mistakes) -- HIGH confidence (government research lab)

### Financial & Rate Data
- [EnergySage: 30-Year Projected Electricity Rates](https://www.energysage.com/news/30-year-projected-electricity-rates-solar-savings/) -- MEDIUM confidence
- [Solar Project Builder: Electricity Rate Escalator](https://www.solarprojectbuilder.org/index.php/help/electricity-rate-escalator/) -- MEDIUM confidence
- [EIA Analysis & Projections](https://www.eia.gov/analysis/projection-data.php) -- HIGH confidence (government source)
