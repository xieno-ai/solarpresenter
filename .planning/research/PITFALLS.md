# Domain Pitfalls

**Domain:** Solar Proposal Generator (SunPitch scraping, utility bill extraction, financial calculations, branded PDF generation)
**Project:** Northern NRG Solar Presenter
**Researched:** 2026-03-02

---

## Critical Pitfalls

Mistakes that cause rewrites, incorrect customer-facing numbers, or fundamental architecture failures.

---

### Pitfall 1: SunPitch DOM Structure Changes Break Scraper Silently

**What goes wrong:** SunPitch is a third-party JavaScript SPA. When they update their frontend (new framework version, redesigned components, renamed CSS classes), selectors break. The scraper returns empty strings, partial data, or stale cached values instead of failing loudly. A sales rep generates a proposal with blank or wrong system data and sends it to a customer.

**Why it happens:** Scrapers coupled to specific CSS selectors, class names, or DOM hierarchy are inherently fragile against third-party changes. SPAs are especially volatile because component libraries generate dynamic class names (e.g., CSS modules, Tailwind JIT, styled-components hashes). SunPitch has no obligation to maintain DOM stability for external consumers.

**Consequences:**
- Proposals generated with missing or incorrect data (system size, production, costs)
- Sales reps may not notice subtle data errors (wrong monthly kWh value)
- Silent failures erode trust in the tool

**Prevention:**
1. **Validate every extracted field.** After scraping, run a validation pass: system size must be > 0, monthly production array must have 12 entries, no nulls/empty strings in required fields. Fail loudly with a clear error message if any validation fails.
2. **Use content-based selectors over structural selectors.** Prefer `text()` content matching, `aria-label`, or `data-*` attributes over CSS class chains. Look for stable text patterns like "System Size" labels rather than `.css-1a2b3c > div:nth-child(3)`.
3. **Build a scraper health check.** Test against the known example URL (`db9b7ee9-...`) on a schedule (or at app startup). If the expected data shape changes, alert before a rep encounters the failure.
4. **Design the scraper as a swappable module.** Isolate scraping logic behind a clean interface (`SunPitchData` type in, URL in). When SunPitch changes, only one module needs updating.
5. **Screenshot the page alongside data extraction.** Store a screenshot for debugging when values look wrong.

**Detection (warning signs):**
- Any extracted field is null, empty, or an unexpected type
- Monthly production array has fewer or more than 12 entries
- System size is unrealistically small (< 1 kW) or large (> 50 kW for residential)
- Scrape takes significantly longer or shorter than baseline

**Confidence:** HIGH -- DOM instability for third-party SPAs is universal and well-documented.

**Phase relevance:** SunPitch Scraping phase. Must be addressed from day one of scraper development.

---

### Pitfall 2: Floating-Point Arithmetic Corrupts Financial Calculations

**What goes wrong:** JavaScript uses IEEE 754 double-precision floats. `0.1 + 0.2 === 0.30000000000000004`. In a 20-year or 30-year compound projection with 5% annual increases, these micro-errors accumulate. A utility cost projection that should show $45,230.00 shows $45,230.01 -- or worse, rounding cascades produce a $50+ discrepancy across 30 years of compounding. The proposal numbers don't match the spreadsheet the formulas were derived from.

**Why it happens:** JavaScript has no native decimal type. Every monetary calculation using native `Number` introduces binary floating-point error. Over 20-30 years of compound calculations with intermediate rounding, these errors compound. The documented formulas likely assume exact decimal arithmetic (as in Excel, which uses a decimal representation internally for many operations).

**Consequences:**
- Proposal numbers don't match the reference spreadsheet
- Customer or competitor spots a $20-100 discrepancy in 20-year savings
- Destroys credibility of the proposal as a financial document
- Debugging compound rounding errors across 9 formula sections is extremely time-consuming

**Prevention:**
1. **Use a decimal arithmetic library for ALL monetary calculations.** Recommended: `Decimal.js` (arbitrary precision, configurable rounding). Not `big.js` (fewer features). Not `dinero.js` (currency-focused, adds unnecessary abstraction for this use case where we need raw decimal math).
2. **Store all monetary values as Decimal objects throughout the calculation pipeline.** Never convert to native `Number` until final display formatting.
3. **Match rounding behavior to the reference spreadsheet exactly.** The calculations document specifies rounding rules. Implement them identically: round at the same intermediate steps, to the same decimal places, using the same rounding mode (likely ROUND_HALF_UP, which is Excel's default, NOT JavaScript's default banker's rounding).
4. **Build verification tests against known spreadsheet outputs.** For a given set of inputs, the calculation engine must produce the exact same outputs as the reference spreadsheet, cell by cell. This is your regression test suite.
5. **Document every rounding decision.** Each formula section should have a comment: "Round to 2 decimal places here to match spreadsheet row X."

**Detection (warning signs):**
- Any calculated value differs from the reference spreadsheet by even $0.01
- Running the same inputs twice produces different results (should never happen)
- 20-year and 30-year totals diverge from expected values more than intermediate years

**Confidence:** HIGH -- IEEE 754 floating-point issues in JavaScript financial calculations are exhaustively documented and inevitable without mitigation.

**Phase relevance:** Calculation Engine phase. Must be the foundational decision before writing any formula code.

---

### Pitfall 3: LLM Vision Extraction Hallucinates or Transposes Numbers from Utility Bills

**What goes wrong:** The AI extracts "1,245 kWh" when the bill actually says "1,254 kWh" (transposed digits). Or it reads "$0.168/kWh" as "$0.186/kWh" from a low-resolution scan. Or it confidently invents a monthly breakdown when the bill only shows an annual total. The extraction looks plausible, passes cursory review, and feeds wrong numbers into the calculation engine. The resulting proposal shows incorrect savings projections.

**Why it happens:** LLMs generate output based on probabilities, not character-by-character transcription. They do not reliably indicate uncertainty for specific digits. A blurry "5" and "6" are indistinguishable to the model, but it will confidently output one. Alberta utility bills vary wildly in format: EPCOR vs. ATCO vs. ENMAX vs. Direct Energy each have different layouts, fonts, scan qualities, and terminology. Photos taken at angles compound the problem.

**Consequences:**
- Incorrect rate calculations propagate through every formula
- Monthly kWh errors affect net metering, carbon credits, and savings projections
- A single transposed digit in the energy rate (e.g., 16.8 vs 18.6 cents/kWh) produces thousands of dollars of error over 20 years
- Hard to catch because extracted values are plausible-looking numbers

**Prevention:**
1. **Always show extracted values for human confirmation.** Never auto-submit extracted data into calculations. Display each extracted field with the source region of the bill highlighted, requiring the user to confirm or correct.
2. **Cross-validate extracted values against plausibility ranges.** Alberta residential energy rates are typically $0.08-$0.25/kWh. Monthly consumption is typically 400-2000 kWh. Flag anything outside expected ranges.
3. **Use structured extraction prompts that require citing source location.** Prompt the LLM to specify where on the bill each value was found (e.g., "Monthly kWh found in bar graph on page 1, bottom left"). This makes verification easier.
4. **Consider a hybrid approach: OCR first, LLM for interpretation.** Use a dedicated OCR engine (Tesseract, Google Vision API) for raw text extraction, then use the LLM to interpret the structured text. This separates "reading characters" from "understanding layout."
5. **Design the bill extractor as a convenience, not a dependency.** The manual entry mode must be the equally-supported primary path. Bill extraction is a time-saver, not the critical path. This means the UI should make manual entry just as easy as bill upload.

**Detection (warning signs):**
- Extracted rate is outside $0.05-$0.30/kWh range
- Monthly kWh values are suspiciously uniform (LLM may have fabricated a breakdown)
- Extracted provider name doesn't match the bill's letterhead
- Sum of monthly kWh doesn't approximate annual kWh (when both are available)

**Confidence:** HIGH -- LLM number extraction errors are well-documented. The "Don't Use LLMs as OCR" article specifically warns against trusting LLM-extracted numbers without validation.

**Phase relevance:** Utility Bill Extraction phase. Validation UI must be built alongside extraction logic, not as an afterthought.

---

### Pitfall 4: Web Preview and PDF Render Diverge (The Dual-Rendering Trap)

**What goes wrong:** The proposal looks perfect in the browser but the downloaded PDF has different line breaks, misaligned tables, cut-off text, missing backgrounds, or wrong fonts. Or vice versa. Teams spend weeks chasing rendering parity between two different output modes.

**Why it happens:** There are two fundamentally different architectural approaches, each with a divergence problem:

- **Approach A: React components for web + Puppeteer `page.pdf()` for PDF.** The web uses screen CSS; the PDF uses print CSS. Differences in media queries, viewport widths, font rendering, and CSS print rules cause divergence.
- **Approach B: `@react-pdf/renderer` for both.** Uses its own layout engine (Yoga/flexbox), not the browser's. No HTML tables, no CSS grid, no `calc()`, no `border-collapse`, limited SVG support. Charts require conversion to images. Complex data tables become a nightmare.
- **Approach C: Puppeteer for both (render HTML, screenshot for preview, `page.pdf()` for download).** Solves parity but adds latency to preview and server load.

**Consequences:**
- Sales reps preview one thing, customers receive another
- Constant "it looks different in the PDF" bug reports
- Table columns misalign at page boundaries
- Charts render differently or not at all in PDF mode
- Branded design elements (backgrounds, gradients, icons) disappear in print mode

**Prevention:**
1. **Choose one rendering engine for both outputs.** The strongest approach for this project: build the proposal as HTML/CSS, use Puppeteer/Playwright to generate the PDF, and render the same HTML in an iframe or dedicated route for the web preview. The HTML is the single source of truth.
2. **Use `@media print` and `@media screen` sparingly.** If the same HTML serves both purposes, avoid media-specific styles that create divergence. Use `-webkit-print-color-adjust: exact` and `print-color-adjust: exact` to preserve backgrounds and colors in print.
3. **Set `printBackground: true` in Puppeteer's PDF options.** Without this, all background colors and images are stripped from the PDF.
4. **Call `page.emulateMediaType('screen')` before generating the PDF** so CSS screen styles apply (not print styles), ensuring the PDF matches the web view.
5. **Test PDF output from day one of template development.** Don't build 11 pages of web templates and then discover the PDF is broken. Build one page, verify PDF parity, then proceed.

**Detection (warning signs):**
- Any visual difference between web preview and PDF for the same data
- Background colors or gradients missing in PDF
- Font substitution in PDF (metric differences cause text reflow)
- Tables or charts rendered differently between outputs

**Confidence:** HIGH -- dual-rendering divergence is one of the most commonly reported issues in PDF generation projects.

**Phase relevance:** Proposal Template phase. Architecture decision must be made before any template code is written. The first template page should validate PDF parity before building the remaining 10.

---

### Pitfall 5: Page Breaks Split Tables and Content Mid-Row

**What goes wrong:** The 11-page proposal has data tables (Net Metering monthly breakdown, 20-year projection, carbon credit schedule). When Puppeteer generates the PDF, a table row is split across two pages -- the top half of a row on page 3, the bottom half on page 4. Or a section heading appears at the bottom of a page with its content on the next page. The proposal looks unprofessional.

**Why it happens:** Chromium's print rendering has a long-standing limitation: `page-break-inside: avoid` and `break-inside: avoid` do not reliably work on `<tr>` elements. This is a Chromium bug (Issue #99124) that has been open for over a decade. The CSS Fragmentation specification is only partially implemented.

**Consequences:**
- Unprofessional-looking proposals with split table rows
- Manual workarounds add complexity and fragility
- Content reflows differently for different data lengths, making the problem intermittent

**Prevention:**
1. **Design each proposal page as a fixed-height container.** Since the proposal is exactly 11 pages with known content, design each page as a `div` with explicit height matching the PDF page size (e.g., `height: 1056px` for US Letter at 96 DPI, or use `mm` units). Content is placed within these fixed containers. No reliance on automatic page breaks at all.
2. **Avoid HTML `<table>` elements for data tables.** Use CSS Grid or Flexbox-based table layouts instead. Wrap each "row" in a `<div>` with `break-inside: avoid`. This is more reliable than `<tr>` elements.
3. **If using actual tables, wrap cell content in inner `<div>` elements** and apply `break-inside: avoid` to the div, not the `<tr>`.
4. **For the 20-year/30-year projection tables that may exceed one page,** pre-calculate row heights and manually split the table across pages with repeated headers, rather than relying on CSS to handle the break.
5. **Use `page-break-before: always` or explicit page containers** to force breaks at known boundaries (between proposal sections), rather than letting the engine decide.

**Detection (warning signs):**
- Any table row visually split across two pages in the PDF
- A section heading appearing as the last element on a page
- Content overflow causing unexpected blank space

**Confidence:** HIGH -- Chromium bug #99124 is extensively documented and confirmed across multiple Puppeteer issue threads (#9499, #8708, #9764).

**Phase relevance:** Proposal Template phase. The page layout strategy (fixed-height containers vs. flowing content) must be decided at the start of template development.

---

### Pitfall 6: Hardcoded Alberta Regulatory Values Become Stale

**What goes wrong:** The calculations embed specific values: carbon benchmark price of $65/tonne, grid emission factor of 0.55 t CO2/MWh, net metering sell rate of 33.5 cents/kWh, 5% annual rate increase. These are presented as constants in the calculation document. Alberta's carbon pricing has been in active flux: the TIER regulation froze the industrial carbon price at $95/tonne in 2025 (was scheduled to rise to $110), and a federal-provincial MOU in late 2025 set a minimum of $130/tonne for future periods. The proposal shows outdated carbon credit projections that don't match current policy.

**Why it happens:** Solar proposal calculations depend on regulatory assumptions that change with government policy. Alberta's energy market is deregulated and actively evolving. The calculation document captures a point-in-time snapshot, but:
- Carbon credit benchmarks follow a legislated schedule that gets amended
- Net metering credit rates are negotiated per-retailer and change annually
- The 5% annual rate increase is a historical average that may not hold
- Grid emission factors are updated by Environment and Climate Change Canada

**Consequences:**
- Carbon credit projections become inaccurate (potentially by thousands of dollars over 20 years)
- Customers who verify numbers against current rates lose trust
- Legal/compliance risk if proposals show outdated financial projections as fact

**Prevention:**
1. **Extract ALL regulatory/rate assumptions into a configuration layer.** Never hardcode `0.55`, `65`, `0.168`, `0.335` etc. into formula code. Create a `rates.config` or similar that centralizes every external assumption with its effective date and source.
2. **Display assumptions prominently on the proposal.** Include a footnote or assumptions section: "Based on Alberta carbon benchmark of $X/tonne as of [date], 5% annual rate increase assumption." This is both transparency and legal protection.
3. **Build an "assumptions review" into the app UI.** Before generating a proposal, show the current rate assumptions with a "last verified" date. Allow override for individual proposals.
4. **Document the source for each rate constant** so that when values need updating, someone knows where to look (e.g., "Carbon benchmark: Alberta TIER regulation, current as of [date]").

**Detection (warning signs):**
- Any rate constant that hasn't been reviewed in > 6 months
- News about Alberta energy policy changes (carbon pricing reviews are scheduled for 2026)
- Customer or sales rep questions about specific rate assumptions

**Confidence:** HIGH -- Carbon pricing changes in Alberta are actively occurring (2025 freeze, late 2025 MOU, 2026 review scheduled). Net metering rates vary by retailer and change annually.

**Phase relevance:** Calculation Engine phase. The configuration layer must be built before formulas reference any external rate.

---

## Moderate Pitfalls

Mistakes that cause significant delays, technical debt, or degraded user experience.

---

### Pitfall 7: SunPitch SPA Doesn't Fully Render Before Data Extraction

**What goes wrong:** The scraper navigates to the SunPitch URL and immediately tries to extract data. But the SPA loads in stages: first the shell, then API calls for proposal data, then client-side rendering of charts and tables. The scraper grabs partially-loaded content. Monthly production values are missing, or the satellite image hasn't rendered yet.

**Why it happens:** `networkidle0` (no network requests for 500ms) is the common waiting strategy, but SPAs often have:
- Lazy-loaded components that trigger after initial idle
- WebSocket connections that keep the network "active"
- Canvas-based satellite imagery that loads asynchronously after DOM rendering
- Animation timers that delay content rendering

**Prevention:**
1. **Wait for specific data-bearing elements, not just network idle.** After `networkidle0`, explicitly wait for the selector that contains system size, the monthly production table, and the satellite image. Use `page.waitForSelector()` with a reasonable timeout (15-30 seconds).
2. **Wait for the satellite image/map canvas to fully render.** Solar proposal tools typically use Google Maps or Mapbox. Wait for the canvas element to be present AND for it to have non-zero dimensions.
3. **Add a small delay after network idle as a safety margin** (1-2 seconds, not more). This handles animation-delayed rendering.
4. **Log the extraction results immediately** and fail if any required field is empty, rather than producing a partial result.

**Detection (warning signs):**
- Intermittent missing data (works sometimes, fails sometimes)
- Satellite image is blank or a loading placeholder
- Monthly production array has undefined entries

**Confidence:** HIGH -- SPA rendering timing is one of the most common scraping issues.

**Phase relevance:** SunPitch Scraping phase.

---

### Pitfall 8: Font Loading Failures in Headless PDF Generation

**What goes wrong:** The branded proposal uses Northern NRG's specific fonts. In the browser, fonts load from Google Fonts or local files. In headless Chromium (Puppeteer/Playwright), fonts silently fall back to system defaults. The PDF renders in Arial instead of the brand font. Or worse, font metrics differ between the intended font and the fallback, causing text to overflow containers, table columns to misalign, and the layout to break.

**Why it happens:** Headless Chromium:
- May not have the same fonts installed as the development machine
- Applies its own User-Agent string that Google Fonts may reject
- Does not wait for `@font-face` fonts to load before rendering unless explicitly told to
- On Linux servers, has a minimal font set by default

**Prevention:**
1. **Wait for fonts to load explicitly before PDF generation.** Call `await page.evaluateHandle('document.fonts.ready')` before `page.pdf()`.
2. **Self-host all fonts.** Don't rely on Google Fonts CDN in the PDF generation context. Include font files in the project and reference them via `@font-face` with local `url()` paths.
3. **Set a realistic User-Agent** on the headless browser to prevent CDN font rejection.
4. **Test PDF generation on the deployment environment** (not just local dev machine). Docker containers and cloud servers have different font inventories.
5. **Use `font-display: block` in `@font-face` rules** to prevent FOIT (Flash of Invisible Text) during PDF generation.

**Detection (warning signs):**
- PDF fonts look different from web preview
- Text overflows containers in PDF but not in browser
- Font names in PDF metadata don't match expected fonts

**Confidence:** HIGH -- Puppeteer font loading issues have multiple GitHub issues (#422, #3183, #6834) documenting this exact problem.

**Phase relevance:** Proposal Template phase. Font strategy must be decided before template development begins.

---

### Pitfall 9: Calculation Formula Interdependencies Create a Debugging Nightmare

**What goes wrong:** The 9 sections of calculations have deep interdependencies. Section 3 (Net Metering) feeds into Section 4 (Carbon Credits), which feeds into Section 6 (20-Year Savings). A small error in the monthly grid buy calculation cascades through every downstream section. When the final 20-year total is wrong, you have to trace back through 6 layers of formulas to find the root error.

**Why it happens:** Financial calculation engines are essentially spreadsheets reimplemented in code. But spreadsheets show all intermediate values on screen, making errors visible. In code, intermediate values are often just local variables that disappear. Without explicit intermediate output and testing, errors hide in the middle of calculation chains.

**Prevention:**
1. **Build the calculation engine as a pure function pipeline.** Each section is a pure function: inputs in, outputs out, no side effects. Section 3's output type is Section 4's input type. This makes each section independently testable.
2. **Return ALL intermediate values, not just final results.** The calculation engine should return a full calculation trace: every intermediate sum, every year's projection, every monthly breakdown. Display these in a debug/verification view.
3. **Write unit tests for EACH section independently** against known spreadsheet values. Don't just test the final 20-year total; test each section's output in isolation.
4. **Implement the formulas in the exact order they appear in the calculation document.** Don't optimize or restructure. Clarity and traceability trump elegance.
5. **Add a "verification mode"** that shows all intermediate calculations alongside the reference spreadsheet values for a given test case.

**Detection (warning signs):**
- Final totals are wrong but individual section outputs seem correct (integration error)
- Changing one input produces unexpected changes in unrelated sections
- Difficulty tracing where a specific number comes from

**Confidence:** HIGH -- this is a universal pattern in financial calculation reimplementation.

**Phase relevance:** Calculation Engine phase.

---

### Pitfall 10: Puppeteer/Playwright Resource Consumption in Production

**What goes wrong:** Each PDF generation spins up a headless Chromium instance. Base memory consumption is 200-300 MB per instance. If 3-4 sales reps generate proposals simultaneously, the server runs out of memory or CPU. PDF generation times spike from 3 seconds to 30 seconds. The app becomes unresponsive.

**Why it happens:** Chromium is a full browser engine. Each instance loads the rendering engine, font subsystem, network stack, and JavaScript engine. Even for a "simple" PDF generation task, it's running a complete browser. For SunPitch scraping, another browser instance is needed simultaneously.

**Prevention:**
1. **Reuse a single browser instance with multiple pages.** Don't launch a new `browser` for each operation. Launch once at app startup, create `page` instances as needed, close pages after use.
2. **Limit concurrent operations.** Use a queue with max concurrency (e.g., 2-3 concurrent PDF generations). Additional requests wait in queue.
3. **Set explicit timeouts.** Any browser operation should have a timeout (30 seconds for scraping, 15 seconds for PDF generation). Kill hung processes.
4. **Close pages explicitly after use.** Memory leaks from unclosed pages accumulate over time.
5. **Consider separating scraping and PDF generation** into different worker processes so a scraping timeout doesn't block PDF generation.

**Detection (warning signs):**
- PDF generation time increases over multiple sequential operations
- Memory usage grows without returning to baseline
- Server becomes unresponsive after several proposal generations

**Confidence:** HIGH -- Puppeteer resource consumption is well-documented (200-300 MB baseline, 350-450 MB per complex page).

**Phase relevance:** Architecture/infrastructure phase. Browser instance management should be designed before building features that depend on it.

---

### Pitfall 11: Satellite Image Extraction from SunPitch is Fragile

**What goes wrong:** SunPitch renders the satellite/aerial view of the solar installation using a map component (likely Google Maps, Mapbox, or a custom canvas). The scraper needs to capture this image for the proposal cover page. But: the map tiles haven't loaded, the canvas hasn't rendered, or the image is captured at the wrong zoom level. The proposal shows a gray rectangle or blurry satellite image.

**Why it happens:**
- Map components load tiles asynchronously, often after `networkidle`
- Canvas elements need explicit rendering time
- Map zoom/pan state may differ between page load states
- Screenshot capture timing is tricky for progressive-loading imagery

**Prevention:**
1. **Wait for the map/canvas element specifically.** After general page load, wait for the canvas or image container to have non-zero dimensions and non-blank content.
2. **Use `element.screenshot()` rather than `page.screenshot()`** to capture just the satellite image element, avoiding surrounding UI.
3. **Validate the captured image is not blank.** Check that the image data is not a uniform color (gray placeholder). A simple pixel sampling check can detect this.
4. **Add a generous delay after map load** (2-3 seconds) to allow tile loading to complete.
5. **Consider saving the image at a higher resolution** than displayed, then downscaling for the proposal. Map tiles may be sharper at higher zoom.

**Detection (warning signs):**
- Satellite image appears as gray or white rectangle
- Image is blurry or shows wrong location
- Map watermarks or UI elements captured in the image

**Confidence:** MEDIUM -- specific to SunPitch's implementation, which hasn't been directly tested. General map screenshot challenges are well-documented.

**Phase relevance:** SunPitch Scraping phase.

---

### Pitfall 12: Utility Bill Format Variations Across Alberta Providers

**What goes wrong:** The AI bill extractor works well for EPCOR bills but fails on ATCO or ENMAX bills. Each provider uses different layouts, terminology, line item names, and formats. The extractor looks for "Energy Charges" but ATCO calls it "Electricity Services." Monthly kWh appears in a bar graph on EPCOR bills but as a table on ENMAX bills. The extraction prompt that works for one provider silently produces wrong results for another.

**Why it happens:** Alberta's deregulated electricity market means multiple retailers (EPCOR, Encor by EPCOR, ATCOenergy, ENMAX, Direct Energy) each design their own bill format. There is no standardized layout. Additionally:
- Bills from the same provider change format over time
- Scanned/photographed bills add noise, rotation, and quality issues
- Some bills are multi-page with usage on page 2+
- Bundled gas+electric bills have overlapping terminology

**Prevention:**
1. **Categorize provider-specific extraction strategies.** Don't rely on a single generic prompt. Include provider-specific guidance in the extraction prompt (e.g., "For EPCOR bills, monthly kWh is typically shown in the bar graph on page 1").
2. **Ask the user to identify the provider before extraction** (or detect it from the bill header). Use this to select the appropriate extraction strategy.
3. **Design the extraction output to include a confidence indicator.** The LLM should be prompted to rate its confidence for each extracted field. Low-confidence fields get highlighted in the UI.
4. **Build a test suite of anonymized bills from each major provider.** Test extraction accuracy across providers, not just one.
5. **Support partial extraction gracefully.** If only the annual total is readable (not monthly breakdown), accept that and work with it. Don't force 12-month extraction when the data isn't on the bill.

**Detection (warning signs):**
- Extraction accuracy drops when testing with a different provider's bill
- Monthly kWh values that don't sum to approximately the annual total
- Extracted "all-in rate" that doesn't match the provider's known rate range

**Confidence:** MEDIUM -- Alberta bill format specifics are based on general knowledge of deregulated markets; exact provider format differences need validation with real bills.

**Phase relevance:** Utility Bill Extraction phase. Multi-provider testing should be part of the acceptance criteria.

---

## Minor Pitfalls

Mistakes that cause annoyance, rework, or polish issues but are fixable without architectural changes.

---

### Pitfall 13: PDF File Size Bloat from Embedded Images

**What goes wrong:** Each proposal PDF includes a satellite image, Northern NRG logo, icons, infographics, and potentially chart images. The resulting PDF is 15-30 MB instead of 2-3 MB. Email attachments bounce, downloads are slow, and cloud storage fills up.

**Prevention:**
1. Optimize images before embedding: compress the satellite image to JPEG at 80% quality, use SVG for icons and logos where possible.
2. Resize images to the actual display dimensions before embedding (don't embed a 4000x3000 satellite image to display at 600x400).
3. For charts, render as SVG rather than rasterized images.
4. Test PDF file size as part of the template development process. Set a target (e.g., < 5 MB per proposal).

**Phase relevance:** Proposal Template phase.

---

### Pitfall 14: Chart Rendering Inconsistency Between Web and PDF

**What goes wrong:** The Price History chart and any other data visualizations look crisp in the browser (using a charting library like Chart.js or Recharts) but appear blurry, differently sized, or missing in the PDF. Canvas-based charts (Chart.js) don't translate directly to PDF. SVG-based charts (Recharts, D3) fare better but may have styling differences.

**Prevention:**
1. Use SVG-based charts exclusively (not Canvas-based). SVGs are vector and render crisply at any resolution in both screen and print.
2. If using the Puppeteer HTML-to-PDF approach, charts render natively since Chromium renders them.
3. Test chart rendering in the PDF from the first chart implementation, not after all charts are built.
4. For the Price History chart (which appears to be mostly static/historical data), consider pre-rendering it as an SVG asset rather than generating it dynamically.

**Phase relevance:** Proposal Template phase, specifically the dynamic chart sections.

---

### Pitfall 15: Scraper Timeout Handling and User Experience

**What goes wrong:** SunPitch is slow to respond, or the UUID is invalid, or the page returns a 404. The user pastes a URL and waits 30+ seconds with no feedback before getting a cryptic error. Or the scraper hangs indefinitely.

**Prevention:**
1. Validate the URL format before attempting to scrape (must match `app.sunpitch.com/facing/proposals/{uuid}` pattern).
2. Set an explicit timeout (30 seconds max) on the entire scraping operation.
3. Provide real-time progress feedback: "Connecting...", "Loading proposal...", "Extracting system data...", "Capturing satellite image...".
4. On failure, provide a clear message: "Could not load SunPitch proposal. The URL may be invalid or SunPitch may be temporarily unavailable. You can enter data manually instead."
5. Always offer the manual entry fallback prominently alongside the URL input.

**Phase relevance:** SunPitch Scraping phase, specifically the UI layer.

---

### Pitfall 16: Template Maintenance Burden for Static Pages

**What goes wrong:** Pages 6-11 (Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps) are "static" but Northern NRG will want to update marketing copy, add new FAQ entries, update warranty terms, or change the price history chart. If these pages are deeply embedded in the template code, every text change requires a developer.

**Prevention:**
1. Store static page content in a structured data file (JSON/YAML), not inline in template components. Separate content from presentation.
2. Consider a simple admin interface (even a JSON editor) for updating static content without code changes.
3. Version static content so you can track what was on a proposal at the time it was generated.

**Phase relevance:** Proposal Template phase. Content architecture for static pages.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|---|---|---|---|
| SunPitch Scraping | DOM changes break selectors silently (#1) | CRITICAL | Content-based selectors, validation on every field, health check |
| SunPitch Scraping | SPA partial rendering (#7) | MODERATE | Wait for specific data elements, not just network idle |
| SunPitch Scraping | Satellite image capture failure (#11) | MODERATE | Wait for canvas render, validate non-blank image |
| SunPitch Scraping | Timeout/UX (#15) | MINOR | Progress feedback, explicit timeouts, manual fallback |
| Utility Bill Extraction | LLM number hallucination (#3) | CRITICAL | Human confirmation required, plausibility validation |
| Utility Bill Extraction | Provider format variations (#12) | MODERATE | Provider-specific strategies, multi-provider test suite |
| Calculation Engine | Floating-point errors (#2) | CRITICAL | Decimal.js for all monetary math, match rounding to spreadsheet |
| Calculation Engine | Formula interdependency debugging (#9) | MODERATE | Pure function pipeline, full intermediate value output, per-section tests |
| Calculation Engine | Stale regulatory values (#6) | CRITICAL | Configuration layer for all rates, assumptions displayed on proposal |
| Proposal Template | Web/PDF rendering divergence (#4) | CRITICAL | Single HTML source, Puppeteer for both outputs |
| Proposal Template | Page break table splitting (#5) | CRITICAL | Fixed-height page containers, div-based tables, no auto page breaks |
| Proposal Template | Font loading in headless (#8) | MODERATE | Self-host fonts, `document.fonts.ready`, test on deployment env |
| Proposal Template | PDF file size (#13) | MINOR | Image optimization, target < 5 MB |
| Proposal Template | Chart rendering (#14) | MINOR | SVG-based charts, test in PDF from first chart |
| Proposal Template | Static page maintenance (#16) | MINOR | Content in data files, separate from templates |
| Infrastructure | Browser resource consumption (#10) | MODERATE | Single browser instance, concurrent operation queue, explicit timeouts |

---

## Sources

### Web Scraping / SPA
- [Playwright vs Puppeteer comparison (Oxylabs)](https://oxylabs.io/blog/playwright-vs-puppeteer)
- [Optimizing Wait Strategies in Puppeteer (Latenode)](https://latenode.com/blog/web-automation-scraping/puppeteer-fundamentals-setup/optimizing-wait-strategies-in-puppeteer-a-complete-guide-to-waiting-methods)
- [Puppeteer Web Scraping Guide (Skyvern)](https://www.skyvern.com/blog/complete-puppeteer-scraping-guide-best-practices-for-september-2025/)
- [Playwright Selector Best Practices 2026 (BrowserStack)](https://www.browserstack.com/guide/playwright-selectors-best-practices)
- [10 Common Web Scraping Mistakes (Firecrawl)](https://www.firecrawl.dev/blog/web-scraping-mistakes-and-fixes)

### Document Extraction / LLM Vision
- [Don't Use LLMs as OCR (Medium)](https://medium.com/@martia_es/dont-use-llms-as-ocr-lessons-learned-from-extracting-complex-documents-db2d1fafcdfb)
- [AI Utility Bill Parsing (Airparser)](https://airparser.com/blog/how-to-use-ai-to-parse-utility-bills-and-extract-structured-data/)
- [LLM Vision for Document Extraction (AppGambit)](https://www.appgambit.com/blog/extracting-information-from-scanned-documents-with-llm-vision-models)
- [LLM Document Extraction (Pondhouse Data)](https://www.pondhouse-data.com/blog/document-extraction-with-llms)

### Financial Calculations / Precision
- [JavaScript Rounding Errors in Financial Applications (Robin Wieruch)](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Financial Precision in JavaScript (DEV Community)](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [Decimal.js vs BigNumber.js (Medium)](https://medium.com/@josephgathumbi/decimal-js-vs-c1471b362181)

### PDF Generation / Rendering
- [Puppeteer PDF Generation (pptr.dev)](https://pptr.dev/guides/pdf-generation)
- [Puppeteer Font Issues (Browserless)](https://www.browserless.io/blog/puppeteer-print)
- [Multi-Page PDF with Puppeteer (CodeStax)](https://codestax.medium.com/multi-page-pdf-with-distinct-layout-using-puppeteer-ee8d45c7594b)
- [Table Row Split Between PDF Pages - Puppeteer Issue #9499](https://github.com/puppeteer/puppeteer/issues/9499)
- [Page Break in Tables - Chromium Bug #99124](https://bugs.chromium.org/p/chromium/issues/detail?id=99124)
- [CSS Page Break Avoid Table Row (CopyProgramming)](https://copyprogramming.com/howto/avoid-page-break-inside-row-of-table)

### Alberta Regulatory / Energy
- [Alberta TIER Carbon Price Freeze (ICAP)](https://icapcarbonaction.com/en/news/alberta-cancels-scheduled-price-increase-under-tier-regulation)
- [Alberta TIER MOU Amendments (Dentons)](https://www.dentons.com/en/insights/articles/2025/december/11/december-2025-amendments-to-alberta)
- [Net Metering in Alberta 2026 (Firefly Solar)](https://www.fireflysolar.ca/post/net-metering-alberta-explained)
- [Alberta Micro-Generation (UCA)](https://ucahelps.alberta.ca/residential/electricity/micro-generation/)
