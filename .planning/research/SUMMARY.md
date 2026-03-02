# Project Research Summary

**Project:** Northern NRG Solar Presenter
**Domain:** Solar proposal generation (single-company, Alberta-focused internal tool)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Executive Summary

Northern NRG Solar Presenter is a focused internal tool with one job: take system design data (from SunPitch or manual entry), run Alberta-specific financial calculations, and produce a branded 11-page sales proposal as both a web preview and a downloadable PDF. This is deliberately NOT a full-stack solar platform — SunPitch handles system design, competitors handle CRM and e-signatures. The scope discipline is the key insight: every complexity decision in this project should be justified against that narrow mandate.

The recommended approach is a Next.js 15 full-stack application with a strict three-layer architecture: a pure TypeScript calculation engine (the intellectual core), React components for proposal rendering (shared between web preview and PDF generation via Playwright), and server-side API routes for the heavy lifting (Playwright scraping, AI bill extraction, PDF export). The "one template, two outputs" pattern — using the same HTML/CSS for both browser preview and Playwright-rendered PDF — is the single most important architectural decision and eliminates the most common source of drift bugs in proposal generators. The tool must be self-hosted (VPS/Docker), not deployed to Vercel, because Playwright/Chromium cannot run in Vercel's serverless environment.

The top risks are: (1) SunPitch DOM changes silently breaking the scraper and producing proposals with wrong data, (2) floating-point arithmetic errors accumulating across 20-30-year compound projections, (3) Alberta regulatory values (carbon benchmark prices, net metering rates) becoming stale without a configuration layer, and (4) web preview and PDF rendering diverging if the single-source-of-truth pattern is not enforced from day one. All four risks are preventable with architectural decisions made before coding begins — they cannot be patched in later without significant rework.

---

## Key Findings

### Recommended Stack

The stack prioritizes single-tool solutions over best-in-class specialization, because every additional dependency is a maintenance burden for what will likely be a 1-2 developer project. Playwright handles both SunPitch scraping AND PDF generation — one browser automation dependency instead of two. Zod schemas serve triple duty: form validation, AI structured output validation, and API payload validation. Tailwind CSS v4 styles both the web preview and the Playwright-rendered PDF without divergence.

See [STACK.md](./STACK.md) for full rationale, version verification, and alternatives considered.

**Core technologies:**
- **Next.js 15.5 + React 19 + TypeScript 5.4:** Full-stack framework with App Router and API routes — provides server-side execution for Playwright/AI without a separate backend service.
- **Playwright 1.58:** Browser automation for SunPitch SPA scraping AND PDF generation via `page.pdf()` — one dependency for both jobs. Superior auto-wait makes it more reliable than Puppeteer for dynamic SPAs.
- **Vercel AI SDK 6 + Gemini 2.0 Flash:** Provider-agnostic LLM interface with Zod structured output. Gemini Flash is 25x cheaper than GPT-4o for input tokens; adequate for utility bill OCR/field extraction tasks.
- **Tailwind CSS 4.2:** CSS-first configuration, 5x faster builds, and critically: same classes work identically in browser and Playwright-rendered PDF.
- **Zod 4.3 + React Hook Form 7:** Single schema powers form validation, LLM output validation, and API validation — defined once, used everywhere.
- **Decimal.js:** Arbitrary-precision decimal arithmetic for all monetary calculations — mandatory to prevent IEEE 754 floating-point errors in 30-year compound projections.
- **SQLite via better-sqlite3 + Drizzle ORM:** Zero-infrastructure database for a single-company internal tool. No database server, no ops burden, trivially sufficient for 1-5 concurrent users.
- **sharp 0.34:** Image preprocessing for utility bill photos before AI extraction and proposal image optimization for PDF.

**Deployment constraint:** Self-host on VPS (DigitalOcean, Railway, Fly.io) or Docker. Vercel's serverless functions cannot run Playwright/Chromium. A $6/mo VPS handles this workload trivially.

---

### Expected Features

This tool sits in the "proposal output" layer of the solar sales stack, downstream of SunPitch's system design. Its table stakes are therefore different from a full solar platform — the expected features are about calculation accuracy, data input reliability, and proposal output quality, not 3D design or CRM.

See [FEATURES.md](./FEATURES.md) for full feature list, dependencies, and anti-features.

**Must have (table stakes):**
- **Manual data entry form** — the always-works fallback that defines the data schema everything else depends on. Build first.
- **Calculation engine** — all 9 formula sections: utility cost projections (20yr/30yr at 5% escalation), net metering (Alberta retail buy/sell rates), carbon credits (SolarOffset.ca), cash-back (3% on grid purchases), true all-in savings, monthly finance analysis. Must be verified against the reference spreadsheet.
- **11-page branded proposal rendering (web preview)** — pages 1-5 dynamic (customer-specific), pages 6-11 static (marketing content). Must match Northern NRG template design.
- **PDF download** — the primary deliverable. Must be pixel-accurate to the web preview.
- **SunPitch URL scraping** — the primary workflow shortcut; paste URL, get all system data extracted automatically.
- **Utility bill AI extraction** — photograph or upload a bill, have consumption/rate data extracted to pre-fill the manual form.
- **Data validation** — range checks, cross-validation between fields, clear error indicators.
- **Charts and visualizations** — utility cost projection chart, production/consumption comparison. Required for a professional sales document.

**Should have (differentiators):**
- **Alberta-specific rate intelligence** — hardcoded knowledge of EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy rate structures eliminates the "wrong rate" error class.
- **Carbon credit integration** — Alberta SolarOffset.ca schedule with 10-year projections; most national tools ignore Canadian carbon credits entirely.
- **Dual-horizon projections (20 and 30 year)** — most tools show 25-year only; showing both gives sales reps flexibility.
- **Print-optimized CSS** — proposal renders correctly from Ctrl+P without a separate PDF step.
- **Shareable proposal URL** — generate a unique link for the customer to view online (v2 candidate).

**Defer (v2+):**
- Shareable proposal URLs with view tracking analytics
- Proposal versioning and revision history
- Pre-populated cash vs. finance comparison toggle
- Multi-language support (English/French)
- Alberta rate auto-detection from utility provider name

**Anti-features (explicitly out of scope):**
Solar system design/panel layout, CRM/lead management, e-signature/contracts, financing marketplace integrations, real-time utility rate APIs, 3D visualization, mobile-first design, user accounts/authentication, automated email sending.

---

### Architecture Approach

The architecture has five jobs with a strict dependency order: collect data → calculate financials → render proposal → preview in browser → export as PDF. The calculation engine is pure TypeScript with zero React/DOM dependencies, making it independently testable and usable on both client and server. The proposal renderer is "dumb" — it receives fully calculated data as props and renders it, never recalculating anything. PDF generation uses the "Playwright visits a URL" pattern: data is stored in a short-lived in-memory cache, Playwright navigates to a `/proposal/render/[token]` route, renders the same React components the user sees in preview, and calls `page.pdf()`. This guarantees visual parity without any server-side React rendering setup.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component map, data flows, patterns, and anti-patterns.

**Major components:**
1. **Input Layer (React client)** — Three-tab form: SunPitch URL, bill upload, manual entry. Receives structured JSON from server API routes and feeds the calculation engine.
2. **SunPitch Scraper (API route, server-side)** — Playwright launches headless Chromium, navigates SunPitch SPA, extracts structured data. Selectors isolated in `selectors.ts` for easy maintenance when SunPitch's DOM changes.
3. **Bill Extractor (API route, server-side)** — Vercel AI SDK + Gemini Flash: sends bill image/PDF, returns structured JSON validated against Zod schema. Feeds consumption/rate fields into the manual entry form.
4. **Calculation Engine (pure TypeScript, shared)** — Nine formula sections as pure functions. `ProposalInputs` in, `ProposalOutputs` out. No DOM, no API calls, no side effects. Independently unit-tested against reference spreadsheet.
5. **Proposal Renderer (React components)** — `ProposalDocument` composed of 11 page components. Receives calculated data as props. Renders identically in browser and in Playwright's headless Chromium.
6. **PDF Generator (API route, server-side)** — Stores data in 60-second TTL cache, generates token URL, Playwright navigates to `/proposal/render/[token]`, calls `page.pdf({ format: 'Letter', printBackground: true })`, returns buffer.
7. **Static Assets** — Logos, fonts (self-hosted, not CDN), marketing images. Self-hosting fonts is mandatory for reliable headless Chromium rendering.

---

### Critical Pitfalls

See [PITFALLS.md](./PITFALLS.md) for all 16 pitfalls with full prevention strategies and phase relevance.

1. **SunPitch DOM changes break scraper silently** — Use content-based selectors (aria-label, data-* attributes, text matching) over structural CSS selectors. Validate every extracted field immediately; fail loudly if any required field is null/empty. Build a scraper health check against the known example URL.

2. **Floating-point arithmetic corrupts financial calculations** — Use `Decimal.js` for ALL monetary calculations without exception. Never use native JavaScript `Number` for intermediate monetary values. Match the rounding mode and rounding points to the reference spreadsheet exactly. Unit-test every formula section against known spreadsheet outputs.

3. **Hardcoded Alberta regulatory values become stale** — Extract ALL rate constants (carbon benchmark $65/t, grid emission factor 0.55 t CO2/MWh, net metering sell rate 33.5c/kWh, 5% escalation assumption) into a centralized `rates.config` with effective dates. Display assumptions on the proposal as a footnote. Alberta carbon pricing is actively changing (2025 freeze, late-2025 MOU, 2026 review scheduled).

4. **Web preview and PDF rendering diverge** — Enforce "single HTML source" from day one: same React components, same CSS, Playwright for PDF. Use `printBackground: true` in PDF options. Call `page.emulateMediaType('screen')` before `page.pdf()` so screen CSS applies (not print CSS). Test PDF output from the first template page, not after all 11 are built.

5. **Page breaks split table rows mid-row** — This is a known Chromium bug (#99124) that has been open for over a decade. Mitigation: design each proposal page as a fixed-height container (explicit `height` in `mm` or pixels). Use CSS Grid/Flexbox `<div>`-based table layouts with `break-inside: avoid` on row divs, not `<tr>` elements. Use `page-break-before: always` between proposal sections.

6. **LLM bill extraction hallucinates or transposes numbers** — Never auto-submit extracted data into calculations. Always display extracted values for human confirmation with plausibility range checks. Design bill extraction as a convenience pre-fill, not the primary data path.

---

## Implications for Roadmap

Based on the dependency chain discovered in research, there is a clear natural build order that must not be violated: manual form → calculation engine → proposal rendering → PDF generation → SunPitch scraping → bill extraction. Each phase produces a usable checkpoint, and earlier phases validate assumptions for later phases.

### Phase 1: Foundation and Calculation Engine

**Rationale:** The calculation engine is the intellectual core of the product and must be correct before anything else is built. Wrong numbers in a beautiful template are worse than right numbers in a plain page. The manual entry form defines the data schema that every other input path (scraping, bill extraction) must conform to. Building calculations first with unit tests against the reference spreadsheet creates a verified baseline.

**Delivers:** A working calculation engine verified against the reference spreadsheet, a manual entry form that exercises every input field, and TypeScript types that define the data contract for all subsequent phases.

**Addresses:** All 9 formula sections (utility cost projections, net metering, carbon credits, cash-back, true savings, monthly finance analysis), data validation, `ProposalInputs`/`ProposalOutputs` type definitions.

**Critical decisions this phase must make:**
- `Decimal.js` adopted for all monetary math (Pitfall #2 — cannot be retrofitted later)
- All rate constants extracted to `rates.config` with effective dates (Pitfall #6)
- Calculation engine structured as pure functions pipeline with intermediate value output (Pitfall #9)

**Research flag:** Standard patterns — no additional research needed. The calculation formulas are documented. The Decimal.js pattern is well-established.

---

### Phase 2: Proposal Rendering (Web Preview)

**Rationale:** Once calculations are verified, the proposal template makes the product visually real and constitutes the first working MVP checkpoint. A rep can manually enter data and see a complete branded proposal. This phase also forces the single-source-of-truth CSS architecture decision before any templates are built.

**Delivers:** A complete 11-page branded proposal renderable in the browser from manually entered data. The web preview IS the MVP — it proves the full data → calculation → render pipeline.

**Addresses:** 11-page proposal structure (pages 1-5 dynamic, 6-11 static), Northern NRG branding, data tables, charts (SVG-based), satellite image placeholder, static marketing pages content architecture.

**Critical decisions this phase must make:**
- CSS architecture for web + print parity established from page one (Pitfall #4)
- Fixed-height page container strategy for page breaks (Pitfall #5)
- Font self-hosting strategy decided and implemented before building templates (Pitfall #8)
- SVG-based charts chosen over Canvas-based (Pitfall #14)
- Static page content stored in data files, not inline (Pitfall #16)

**Research flag:** Needs deeper research during planning for one area: charting library selection (Recharts vs. Victory vs. custom SVG for the specific chart types in the Northern NRG template). The proposal charts may have specific design requirements that constrain library choice.

---

### Phase 3: PDF Generation

**Rationale:** PDF is the primary deliverable — sales reps email PDFs to customers. This phase completes the core workflow. It depends on the proposal renderer being complete and the CSS architecture being validated. PDF parity should have been confirmed page-by-page during Phase 2; Phase 3 wires up the download button and the Playwright generation pipeline.

**Delivers:** A "Download PDF" button that produces a pixel-accurate 11-page PDF matching the web preview.

**Addresses:** Playwright PDF generation, temporary data cache for the "visit URL" pattern, `/proposal/render/[token]` route, browser resource management, download UX.

**Critical decisions this phase must make:**
- `printBackground: true` and `page.emulateMediaType('screen')` in PDF options (Pitfall #4)
- Single browser instance reused across requests with page-level concurrency (Pitfall #10)
- `await page.evaluateHandle('document.fonts.ready')` before `page.pdf()` (Pitfall #8)
- Target PDF file size < 5 MB; image compression strategy confirmed (Pitfall #13)

**Research flag:** Standard patterns — Playwright `page.pdf()` with the "visit a URL" pattern is well-documented and proven.

---

### Phase 4: SunPitch Scraping

**Rationale:** SunPitch scraping is the workflow accelerator — paste URL, get complete proposal in seconds. It's placed fourth because (a) it requires hands-on investigation of SunPitch's current DOM structure, which can only happen at build time, (b) the rest of the app must work without it, and (c) scraping is inherently fragile; building it against a stable foundation means failures degrade gracefully to manual entry rather than breaking the whole app.

**Delivers:** A SunPitch URL tab that auto-populates all proposal input fields from a pasted URL, with progress feedback and graceful fallback to manual entry on failure.

**Addresses:** Playwright SPA scraping, selector mapping and isolation, satellite image capture, SunPitch-specific data extraction and transformation, URL validation, timeout/error handling UI.

**Critical decisions this phase must make:**
- Content-based selectors (aria-label, data-*, text matching) over structural CSS selectors (Pitfall #1)
- Every extracted field validated immediately; fail loudly on null/empty (Pitfall #1)
- Selector mapping isolated in `selectors.ts` separate from scraping logic (Pitfall #1, Architecture)
- Scraper health check against example URL implemented (Pitfall #1)
- Specific wait strategy for SPA partial rendering (Pitfall #7): wait for data-bearing elements, not just `networkidle`
- Satellite image validation: check for non-blank canvas before proceeding (Pitfall #11)

**Research flag:** Needs deeper research — specifically, SunPitch's current DOM structure must be discovered by manually inspecting the known example URL (`db9b7ee9-...`). Selector mapping cannot be finalized until real SunPitch proposal pages are inspected. This phase will require discovery work before implementation can begin.

---

### Phase 5: Utility Bill AI Extraction

**Rationale:** Bill extraction is the convenience feature that pre-fills consumption data from a photographed or uploaded bill. It is placed last because it is a helper function for the data input layer, not on the critical path, and it carries the most external dependency risk (AI provider quality, Alberta bill format variations). The tool is fully functional without it.

**Delivers:** A bill upload tab that accepts a photo or PDF, extracts consumption/rate data via AI, and pre-fills the matching manual entry fields — with a human confirmation step before data is committed.

**Addresses:** Vercel AI SDK integration, Gemini Flash structured output with Zod schema, `sharp` preprocessing, bill upload API route, human confirmation UI, plausibility validation, Alberta provider variations.

**Critical decisions this phase must make:**
- Human confirmation step required before extracted data flows to calculations — never auto-submit (Pitfall #3)
- Plausibility range validation on every extracted field: rates $0.05-$0.30/kWh, monthly kWh 400-2000 (Pitfall #3)
- Bill extraction is a pre-fill convenience, not a required input path; manual entry remains equally supported (Pitfall #3)
- Provider-specific extraction guidance in prompt (Pitfall #12)
- Test against anonymized bills from each major Alberta provider (EPCOR, Encor, ATCOenergy, ENMAX, Direct Energy) as acceptance criteria (Pitfall #12)

**Research flag:** Needs deeper research on Alberta utility bill formats — specifically, collecting sample bills from all five major providers to validate extraction accuracy before shipping. This is acceptance-criteria research, not architecture research.

---

### Phase Ordering Rationale

- **Manual entry before scraping:** Manual entry defines the data schema and always works. Scraping is a convenience layer that must conform to the same schema. Building schema-first prevents the scraper from driving data structure decisions.
- **Calculations before rendering:** Wrong numbers in a rendered template create bugs that are hard to isolate. Verified calculations with unit tests mean rendering bugs and calculation bugs can be diagnosed separately.
- **Rendering before PDF:** The web preview is where CSS issues surface. Discovering page break problems or font issues during web rendering (Phase 2) costs far less than discovering them after committing to a PDF architecture (Phase 3).
- **Core pipeline before external dependencies:** Phases 1-3 are entirely within the application's control. Phases 4-5 depend on SunPitch (third-party, can change without notice) and AI providers (external APIs with accuracy variability). Completing the internal pipeline first means external failures don't block the core product.
- **Scraping before bill extraction:** Scraping is on the critical path for the primary sales workflow. Bill extraction is a helper. If forced to choose, scraping has higher priority.

---

### Research Flags Summary

| Phase | Research Flag | Reason |
|-------|--------------|--------|
| Phase 1: Calculation Engine | Skip — standard patterns | Pure TypeScript math, documented formulas, Decimal.js is well-established |
| Phase 2: Proposal Rendering | Partial research needed | Chart library selection for specific Northern NRG chart types may benefit from exploration |
| Phase 3: PDF Generation | Skip — standard patterns | Playwright `page.pdf()` + "visit URL" pattern is proven and documented |
| Phase 4: SunPitch Scraping | Research required | Must inspect actual SunPitch DOM before selectors can be designed |
| Phase 5: Bill Extraction | Acceptance-criteria research | Collect sample bills from 5 Alberta providers; validate extraction accuracy |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified on npm as of 2026-03-02. Version numbers confirmed. Deployment constraint (self-host) confirmed against Vercel documentation. |
| Features | HIGH | Table stakes derived directly from PROJECT.md requirements and cross-validated against Aurora Solar, OpenSolar, Solargraf, Enerflo. Anti-features confirmed against PROJECT.md out-of-scope section. |
| Architecture | HIGH | "One template, two outputs" and "Playwright visits URL for PDF" patterns are well-documented in production guides. Calculation engine as pure functions is standard separation of concerns. Component boundaries are clear. |
| Pitfalls | HIGH | All 6 critical pitfalls are backed by verified bugs (Chromium #99124), published IEEE 754 documentation, active Alberta regulatory changes (confirmed 2025-2026), and Puppeteer/Playwright GitHub issues. |

**Overall confidence:** HIGH

### Gaps to Address

- **SunPitch DOM structure:** Cannot be finalized until a real SunPitch proposal URL is inspected. The scraper design in ARCHITECTURE.md is architecturally sound, but the actual selectors and data extraction logic require hands-on discovery. Handle by treating Phase 4 as having a mandatory investigation step before coding begins.

- **Alberta bill format variations:** PITFALLS.md rates the multi-provider extraction challenge as MEDIUM confidence because the specific format differences between EPCOR, Encor, ATCOenergy, ENMAX, and Direct Energy bills haven't been directly tested. Handle by building a multi-provider test suite with anonymized real bills as part of Phase 5 acceptance criteria.

- **Exact chart specifications:** The Northern NRG template PDF specifies certain chart types (utility cost projection, production/consumption comparison, price history). The exact design requirements for these charts may constrain the charting library choice. Handle by reviewing the template PDF during Phase 2 planning.

- **Calculation formula details:** The research references a "calculations document" with exact formulas, but the calculations document itself was not part of the research corpus. The calculation engine architecture is solid, but the specific formula implementations require access to that document. This is a known dependency, not a gap — the document exists and should be reviewed in Phase 1 planning.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15) — version selection rationale
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) — v1.58.2 verified
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) — SDK 6.x capabilities
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — v4.2.0 verified
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) — $0.10/M input tokens verified
- [Chromium Bug #99124](https://bugs.chromium.org/p/chromium/issues/detail?id=99124) — `page-break-inside: avoid` on `<tr>` elements
- [Alberta Micro-Generation (UCA)](https://ucahelps.alberta.ca/residential/electricity/micro-generation/) — government source for net metering
- [SolarOffset.ca](https://www.solaroffset.ca/) — carbon credit platform referenced in PROJECT.md
- [Alberta TIER Carbon Price Freeze (ICAP)](https://icapcarbonaction.com/en/news/alberta-cancels-scheduled-price-increase-under-tier-regulation) — confirmed regulatory changes
- [Alberta TIER MOU Amendments (Dentons)](https://www.dentons.com/en/insights/articles/2025/december/11/december-2025-amendments-to-alberta) — late-2025 carbon pricing changes
- [Aurora Solar Proposal Documentation](https://help.aurorasolar.com/hc/en-us/categories/12124059708435-Proposals-Documents) — competitor feature validation
- [OpenAI PDF Files Guide](https://platform.openai.com/docs/guides/pdf-files) — PDF input to GPT-4o confirmed

### Secondary (MEDIUM confidence)
- [Playwright vs Puppeteer (ZenRows 2026)](https://www.zenrows.com/blog/playwright-vs-puppeteer) — tool comparison
- [Drizzle vs Prisma (Bytebase 2026)](https://www.bytebase.com/blog/drizzle-vs-prisma/) — ORM comparison
- [Turning React Apps into PDFs with Next.js and Puppeteer](https://dev.to/jordykoppen/turning-react-apps-into-pdfs-with-nextjs-nodejs-and-puppeteer-mfi) — "visit URL" pattern
- [Don't Use LLMs as OCR (Medium)](https://medium.com/@martia_es/dont-use-llms-as-ocr-lessons-learned-from-extracting-complex-documents-db2d1fafcdfb) — LLM extraction pitfalls
- [Financial Precision in JavaScript (DEV Community)](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc) — Decimal.js recommendation
- [OpusFlow Solar Proposal Software Comparison](https://opusflow.io/blog/solar/solar-proposal-software/) — competitive feature landscape
- [Net Metering in Alberta 2026 (Firefly Solar)](https://www.fireflysolar.ca/post/net-metering-alberta-explained) — current rates context

### Tertiary (reference only)
- Multiple Puppeteer GitHub issues (#422, #3183, #6834, #9499, #8708) — font loading and page break confirmed bugs
- npm package pages for all listed packages — version verification

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*
