# Phase 6: SunPitch Scraping - Research

**Researched:** 2026-03-03
**Domain:** Playwright-based SPA scraping, Next.js API route design, React Hook Form pre-fill
**Confidence:** MEDIUM (SunPitch DOM unknown; Playwright patterns HIGH; RHF integration HIGH)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**URL Entry UX**
- Two tabs at the top of `/enter`: "Paste SunPitch URL" and "Manual Entry"
- URL tab contains the SunPitch URL field and Import button
- After a successful scrape, auto-switch to the Manual Entry tab so the user can review and edit pre-filled values
- URL field starts blank every time (no localStorage persistence for the URL)
- Client-side format validation before hitting the server: check that the URL matches `app.sunpitch.com/facing/proposals/{uuid}` — show an inline error instantly if the format is wrong

**Pre-fill Behavior**
- Scraped data performs a full reset — replaces all form values, no merging with existing manual entries
- Scraped fields are highlighted with a light green background on the input
- The green highlight clears when the user edits that field (their edit takes ownership)
- Fields the scraper tried but couldn't find get an amber/yellow highlight (distinguishes "scrape gap" from "user hasn't touched it")

**Partial Scrape Handling**
- Default behavior: partial fill — populate every field that was found, leave the rest blank (or amber-highlighted)
- Auto-switch to Manual Entry tab after a partial scrape so the user can fill the gaps
- Hard error threshold: if customer name AND system size AND monthly production are all missing, treat as a critical failure (show error, don't partial-fill)
- Any data at all beyond those core fields = proceed with partial fill

**Progress & Error Feedback**
- During the 5–15 second scrape: cycling step-by-step status messages (e.g. "Opening SunPitch proposal... Extracting customer info... Reading system data... Extracting monthly production...")
- Failure states appear inline on the URL tab (replaces the status area)
- No separate retry button — the URL field remains editable and the Import button re-enables after failure

### Claude's Discretion
- The scraper API route design (Next.js API route like `/api/scrape` vs server action — Playwright pattern from Phase 5 is available as reference)
- Exact Playwright selectors and wait strategies (DOM structure unknown until a real SunPitch URL is available for testing)
- The tab UI component styling (should feel consistent with the existing `/enter` form aesthetic)
- How to handle the satellite image: `CustomerInfo` already has `latitude`/`longitude` fields — scraper can try to extract coordinates from SunPitch, fall back to null if unavailable

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPUT-01 | User can paste a SunPitch proposal URL and the system extracts all data via headless browser (system size, monthly production/consumption, rates, costs, financing terms, customer name/address, satellite image) | Playwright API route pattern established in Phase 5 (`/api/pdf`); `page.on('response')` + `waitForSelector` dual-strategy covers SPA; `export const runtime = 'nodejs'` required |
| INPUT-03 | Manual entry form pre-populates with scraped SunPitch data when available, all fields remain editable | RHF `reset(scrapedValues)` replaces all fields atomically; `useState` for highlight map (green/amber) keyed on `ProposalFormValues` field paths; `saveFormDraft` call after reset persists through refresh |
</phase_requirements>

---

## Summary

SunPitch (`app.sunpitch.com`) is a JavaScript-heavy SPA that renders zero useful content in static HTML. All proposal data loads dynamically via JavaScript after page navigation. This means DOM-selector scraping must use Playwright's full browser automation — the same tool already installed in this project for Phase 5 PDF generation (version `^1.58.2`). No new dependencies are required.

The scraper architecture is a POST endpoint at `/api/scrape` that follows the exact pattern of the existing `/api/pdf/route.ts`: `export const runtime = 'nodejs'`, `chromium.launch({ headless: true })`, `try/finally` for browser cleanup. The critical unknown is the SunPitch DOM structure — selectors cannot be written until a real proposal URL is available for inspection. The implementation must use a **dual-strategy approach**: attempt `page.on('response')` network interception first (cleaner, more stable), fall back to DOM scraping with `waitForSelector` if the network response doesn't expose clean JSON.

The React Hook Form pre-fill is straightforward: `reset(scrapedValues)` replaces the entire form atomically. Field highlight state (green = scraped, amber = scraper gap) is managed with a separate `useState<Record<string, 'scraped' | 'missing'>>` map that lives alongside the form, cleared per-field when the user edits. The `saveFormDraft` call after `reset()` ensures a page refresh doesn't wipe the scraped data.

**Primary recommendation:** Build `/api/scrape` as a POST route mirroring `/api/pdf`. Use `page.on('response')` to intercept the proposal data API call — if SunPitch fetches a JSON blob during load, capture it directly rather than scraping the rendered DOM. DOM scraping with `waitForSelector` is the fallback for fields not available in the API response.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| playwright | ^1.58.2 | Headless Chromium for SPA scraping | Already installed (Phase 5); handles JS-rendered content that static parsers cannot |
| react-hook-form | ^7.71.2 | Form state management + `reset()` pre-fill | Already installed; `reset(values)` atomically replaces all fields |
| zod | ^4.3.6 | `proposalFormSchema` — scraper output must satisfy this shape | Already installed; scraper output validation at API boundary |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next (App Router route handlers) | ^16.1.6 | `/api/scrape` POST endpoint | Mirrors `/api/pdf` pattern exactly; handles Node.js runtime directive |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright (full browser) | `fetch` + `cheerio` for HTML parsing | Cheerio fails entirely on SPA — SunPitch renders nothing in static HTML |
| Playwright (full browser) | `puppeteer` | Playwright already installed; same capability; no reason to add Puppeteer |
| `/api/scrape` POST route | Next.js Server Action | Server actions work but POST route is more testable and matches existing `/api/pdf` pattern |

**Installation:**

```bash
# No new installs needed — Playwright already present from Phase 5
# Verify with:
npx playwright install chromium
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── scrape/
│   │       └── route.ts          # POST /api/scrape — Playwright scraper
│   └── enter/
│       ├── page.tsx              # MODIFIED: add tab state, URL tab, pre-fill logic
│       └── components/
│           ├── SunPitchTab.tsx   # URL input, Import button, progress/error display
│           └── FieldHighlight.tsx # or inline: highlight wrapper for FormInput
├── lib/
│   └── scraper/
│       ├── sunpitch.ts           # Playwright scraper logic (called from route.ts)
│       ├── types.ts              # ScrapeResult type, ScrapeStatus enum
│       └── url-validator.ts      # Client-side URL format validation regex
```

### Pattern 1: Next.js POST Route with Playwright (mirrors `/api/pdf`)

**What:** A server-side POST route that launches Playwright, navigates to the SunPitch URL, extracts data, and returns structured JSON.

**When to use:** Any time server-side browser automation is needed — identical to how PDF generation works.

```typescript
// src/app/api/scrape/route.ts
// Source: mirrors existing src/app/api/pdf/route.ts pattern (verified in codebase)

import { NextRequest } from 'next/server';
import { chromium } from 'playwright';
import { scrapeSunPitch } from '@/lib/scraper/sunpitch';
import type { ScrapeResult } from '@/lib/scraper/types';

// REQUIRED: Playwright cannot run in Edge runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<Response> {
  const { url } = await request.json() as { url: string };

  if (!url) {
    return Response.json({ error: 'Missing url' }, { status: 400 });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const result: ScrapeResult = await scrapeSunPitch(browser, url);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scrape failed';
    return Response.json(
      { status: 'error', message, data: null, missingFields: [] },
      { status: 200 }, // 200 — caller reads status field, not HTTP code
    );
  } finally {
    await browser.close();
  }
}
```

### Pattern 2: Dual-Strategy Scraper (network interception + DOM fallback)

**What:** Attempt to capture SunPitch's backend API response (clean JSON) before falling back to DOM scraping with `waitForSelector`.

**When to use:** SPAs that load data via fetch/XHR — network interception gives structured data; DOM scraping handles what the API doesn't expose.

```typescript
// src/lib/scraper/sunpitch.ts
// Source: Playwright network interception patterns (verified via Playwright docs + Scrapfly article)

import type { Browser } from 'playwright';
import type { ScrapeResult } from './types';

export async function scrapeSunPitch(browser: Browser, url: string): Promise<ScrapeResult> {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture any JSON API response that loads the proposal data
  let apiData: Record<string, unknown> | null = null;
  page.on('response', async (response) => {
    const ct = response.headers()['content-type'] ?? '';
    if (!ct.includes('application/json')) return;
    try {
      const json = await response.json();
      // Heuristic: proposal data will contain system size or monthly production
      if (json && (json.systemSize || json.monthlyProduction || json.proposal)) {
        apiData = json;
      }
    } catch {
      // Not JSON or already consumed
    }
  });

  // Navigate — SunPitch facing proposals are public (no auth required)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // Wait for proposal content to render — selector TBD pending real URL inspection
  // Placeholder: wait for a container that holds the proposal data
  await page.waitForSelector('[data-proposal], .proposal-container, main', {
    timeout: 15000,
  });

  if (apiData) {
    return extractFromApiResponse(apiData);
  }

  // Fallback: DOM extraction
  return extractFromDOM(page);
}
```

### Pattern 3: ScrapeResult Type with Status

**What:** Typed return from `/api/scrape` — the client reads `status` to decide what to do.

```typescript
// src/lib/scraper/types.ts
import type { ProposalFormValues } from '@/lib/form/schema';

export type ScrapeStatus = 'success' | 'partial' | 'error';

export interface ScrapeResult {
  status: ScrapeStatus;
  data: Partial<ProposalFormValues> | null;
  missingFields: string[];       // field paths that were not found, e.g. "financing.cashPurchasePrice"
  message?: string;              // human-readable error or warning
}
```

### Pattern 4: RHF Pre-fill with Highlight State

**What:** After a successful/partial scrape, call `reset()` to populate all form fields, then set a highlight map to track field origin.

**When to use:** Any external data pre-population into a React Hook Form.

```typescript
// Conceptual — lives in src/app/enter/page.tsx
// Source: react-hook-form.com/docs/useform/reset (verified)

type HighlightMap = Partial<Record<string, 'scraped' | 'missing'>>;
const [highlights, setHighlights] = useState<HighlightMap>({});

async function handleImport() {
  const result: ScrapeResult = await fetchScrape(urlValue);

  if (result.status === 'error') {
    setImportError(result.message ?? 'Scrape failed');
    return;
  }

  // reset() atomically replaces all form values
  // Pass merged object: empty defaults + scraped data
  reset({ ...getEmptyDefaults(), ...result.data });

  // Persist to localStorage draft so a refresh doesn't wipe scraped data
  saveFormDraft({ ...getEmptyDefaults(), ...result.data } as ProposalFormValues);

  // Build highlight map
  const newHighlights: HighlightMap = {};
  // Mark successfully scraped fields green
  flattenFieldPaths(result.data ?? {}).forEach((path) => {
    newHighlights[path] = 'scraped';
  });
  // Mark missing fields amber
  result.missingFields.forEach((path) => {
    newHighlights[path] = 'missing';
  });
  setHighlights(newHighlights);

  // Switch to Manual Entry tab for review
  setActiveTab('manual');
}

// Clear highlight when user edits a field
function clearHighlight(fieldPath: string) {
  setHighlights((prev) => {
    const next = { ...prev };
    delete next[fieldPath];
    return next;
  });
}
```

### Pattern 5: Client-Side URL Validation

**What:** Regex check before hitting the server — immediate inline error, no round-trip.

```typescript
// src/lib/scraper/url-validator.ts
const SUNPITCH_URL_PATTERN = /^https?:\/\/app\.sunpitch\.com\/facing\/proposals\/[0-9a-f-]{36}$/i;

export function validateSunPitchUrl(url: string): string | null {
  if (!url.trim()) return 'URL is required';
  if (!SUNPITCH_URL_PATTERN.test(url.trim())) {
    return 'URL must be in the format: app.sunpitch.com/facing/proposals/{uuid}';
  }
  return null; // valid
}
```

### Anti-Patterns to Avoid

- **`waitUntil: 'networkidle'` on SunPitch:** SPAs often make background polling/analytics requests that prevent networkidle from resolving. Use `'domcontentloaded'` + `waitForSelector` instead.
- **Relying on CSS class names as selectors:** SunPitch likely uses hashed class names (e.g., `.proposal_abc123`). Prefer `data-*` attributes, semantic HTML (`h1`, `table`), or ARIA roles (`[role="main"]`).
- **Single-strategy scraping:** DOM-only fails if content loads via a secondary API call after initial render. Network interception-only fails if data is rendered server-side into the HTML. Use both.
- **Returning HTTP 500 on scrape failure:** The client needs to show a user-friendly error. Return HTTP 200 with `{ status: 'error' }` so the client can render the inline error message without React error boundaries triggering.
- **Calling `reset()` without passing complete `ProposalFormValues`:** RHF `reset()` with a partial object leaves unspecified fields at their previous values. Always merge with `getEmptyDefaults()` first for a true full-reset.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headless browser for SPA data | Custom HTTP fetch + HTML parser | `playwright` (already installed) | SPAs render nothing in static HTML — Playwright is the only viable approach |
| Form field pre-population | Manual `setValue()` on every field | `reset(mergedValues)` | `reset()` is atomic, handles arrays, clears validation state correctly |
| Draft persistence after import | Custom localStorage write | `saveFormDraft(values)` | Already implemented, handles SSR guard and quota errors |
| URL format validation | Ad-hoc string checks | `validateSunPitchUrl(url)` utility | Centralized regex keeps validation consistent between client and any future server-side checks |
| Field highlight tracking | CSS class on DOM elements | `useState<HighlightMap>` | React state drives the highlight; DOM manipulation outside React state creates de-sync |

**Key insight:** The Phase 5 PDF route already solved the hardest problem: Playwright running correctly inside Next.js with the right runtime directive, args, and try/finally cleanup. This phase is largely replication of that pattern with a different payload.

---

## Common Pitfalls

### Pitfall 1: SunPitch Requires Authentication

**What goes wrong:** Navigating to `app.sunpitch.com/facing/proposals/{uuid}` redirects to a login page instead of showing the proposal.

**Why it happens:** The `/facing/proposals/` path is designed for customer-facing viewing and may be public, but this is unverified. If it requires auth, Playwright will land on a login screen and all selectors will fail silently.

**How to avoid:** Verify with a real SunPitch URL before writing selectors. Detect login redirect by checking `page.url()` after navigation — if it doesn't contain `/facing/proposals/`, surface a clear "SunPitch requires authentication" error rather than a generic scrape failure.

**Warning signs:** `waitForSelector` timeouts on first test; `page.url()` shows `/login` or `/signin` after goto.

### Pitfall 2: Selector Fragility (SPA Hash Classes)

**What goes wrong:** Selectors like `.systemSize_a1b2c3` stop working after SunPitch deploys a new build.

**Why it happens:** React/Vue bundlers hash CSS module class names. A deploy changes every hash.

**How to avoid:** Prefer in order: (1) network interception to get raw JSON, (2) `data-*` attributes if present, (3) semantic HTML (`h1`, `th`, `td`, ARIA roles), (4) text-based heuristics (`page.getByText('System Size')`) as last resort. Document which strategy is used for each field so it's clear what to update when SunPitch changes.

**Warning signs:** Tests pass locally but fail after any SunPitch deployment.

### Pitfall 3: Monthly Array Mismatch

**What goes wrong:** Scraper returns fewer than 12 monthly values, causing Zod validation to fail on the API response, or the form shows validation errors on the monthly grid.

**Why it happens:** SunPitch may present months with zero production as absent rather than zero. The scraper needs to explicitly backfill missing months.

**How to avoid:** After extracting monthly arrays, always normalize to exactly 12 entries: `Array(12).fill('0').map((_, i) => scrapedMonths[i] ?? '0')`. The schema requires exactly 12 entries in range `[0, 5000]`.

**Warning signs:** Zod parse failure on `monthlyProductionKwh` or `monthlyConsumptionKwh` even when scraping appears to succeed.

### Pitfall 4: RHF `reset()` Before Component Mount

**What goes wrong:** Calling `reset()` before the form is fully mounted causes fields to revert to empty state.

**Why it happens:** RHF registers fields during render. Calling `reset()` synchronously in the same render cycle that registers the fields can race.

**How to avoid:** Call `reset()` inside an event handler (button click), never in `useEffect` during mount for this pre-fill case. The import flow is user-triggered, so this is naturally safe.

**Warning signs:** Form appears briefly populated then resets to empty on the next render.

### Pitfall 5: `annualElectricityCost` Is Computed, Not Scraped

**What goes wrong:** The scraper tries to scrape `annualElectricityCost` but leaves the field empty, breaking the form validation.

**Why it happens:** `annualElectricityCost` is a derived field in the form (`annualConsumptionKwh × allInRate`), computed by a `watch()` effect. It may not appear explicitly in SunPitch's UI.

**How to avoid:** The scraper must either (a) derive it from `annualConsumptionKwh × allInRate` before calling `reset()`, or (b) omit it from the scraped payload and let the existing `watch()` effect in the form recompute it after `reset()`. Option (b) is preferred — the effect fires after reset. Ensure the `missingFields` list does NOT include `consumption.annualElectricityCost` since it's expected to be derived.

**Warning signs:** "Annual Electricity Cost" shows amber highlight even when all rates and consumption are populated.

### Pitfall 6: `import` Button Race Condition on Double-Click

**What goes wrong:** User clicks Import twice, two scrape requests fire, and the second `reset()` call clobbers the first.

**Why it happens:** No guard on the in-flight state.

**How to avoid:** Disable the Import button while `isLoading` is `true`. This is the same loading-state pattern used in the existing `GenerateFooter` component.

---

## Code Examples

### Full `/api/scrape` Route (verified pattern from existing codebase + Playwright docs)

```typescript
// src/app/api/scrape/route.ts
import { NextRequest } from 'next/server';
import { chromium } from 'playwright';
import type { ScrapeResult } from '@/lib/scraper/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<Response> {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: 'error', message: 'Invalid JSON body' }, { status: 400 });
  }

  const { url } = body;
  if (!url) {
    return Response.json({ status: 'error', message: 'Missing url' }, { status: 400 });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const result = await scrapeSunPitch(browser, url);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown scrape error';
    const result: ScrapeResult = {
      status: 'error',
      data: null,
      missingFields: [],
      message,
    };
    return Response.json(result, { status: 200 });
  } finally {
    await browser.close();
  }
}
```

### Network Interception Setup (Playwright)

```typescript
// Source: Playwright network interception patterns (Scrapfly article + Playwright docs)
// Set up BEFORE page.goto() to avoid missing responses that fire during load

const capturedApiPayloads: unknown[] = [];

page.on('response', async (response) => {
  const ct = response.headers()['content-type'] ?? '';
  if (!ct.includes('application/json')) return;
  if (!response.ok()) return;

  try {
    const json = await response.json();
    capturedApiPayloads.push({ url: response.url(), data: json });
  } catch {
    // Body already consumed or not valid JSON
  }
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
// Now capturedApiPayloads contains all JSON API responses fired during load
```

### RHF Reset with Complete Defaults Merge

```typescript
// Source: react-hook-form.com/docs/useform/reset (verified)
// ALWAYS merge with getEmptyDefaults() to ensure all 12 monthly slots exist

const scraped: Partial<ProposalFormValues> = await fetchScrapeResult(url);
reset({ ...getEmptyDefaults(), ...scraped });
// RHF fires watch() effects after reset, so annualElectricityCost recomputes automatically
```

### Monthly Array Normalization

```typescript
// Ensures exactly 12 string entries — required by proposalFormSchema
function normalizeMonthlyArray(raw: (string | number | null | undefined)[]): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const v = raw[i];
    if (v == null || v === '') return '0';
    return String(v);
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `waitUntil: 'networkidle'` for SPAs | `'domcontentloaded'` + `waitForSelector` | Playwright v1.x guidance | networkidle hangs on SPAs with background polling |
| DOM-only scraping with CSS class selectors | Network interception first, DOM fallback | Playwright v1.20+ | API JSON is more stable than rendered class names |
| `setValue()` per field for pre-fill | `reset(values)` for batch pre-fill | RHF v7 | `reset()` is atomic, clears errors, handles Controller state |

---

## Open Questions

1. **Does `app.sunpitch.com/facing/proposals/{uuid}` require authentication?**
   - What we know: The `/facing/` path segment suggests customer-facing (public) viewing
   - What's unclear: Whether NRG-specific proposals require a token or cookie — no public SunPitch docs found
   - Recommendation: Test with a real URL in the first implementation task (Wave 1, Task 1 should be "inspect a real SunPitch URL") before writing any selectors

2. **What JSON API endpoints does SunPitch call during page load?**
   - What we know: The app is a React SPA that loads data asynchronously; Material Icons and Roboto font suggest a Vue Material or React Material UI framework
   - What's unclear: Whether proposal data comes from a single `/api/proposals/{uuid}` call or multiple calls; what the response shape is
   - Recommendation: Open DevTools on a real proposal URL and inspect the Network tab. Log all JSON responses in the first Playwright run to discover the endpoint pattern.

3. **Does SunPitch expose monthly production per month or only annual totals?**
   - What we know: The requirements list monthly production as a required field
   - What's unclear: SunPitch's output format — it may only show monthly chart values visually, not as input values
   - Recommendation: If monthly data is only in a chart, use DOM-to-array extraction by inspecting chart data attributes or the underlying charting library's data store (e.g., Recharts stores data in `__reactFiber`).

4. **Are financing terms (monthly payment, interest rate, term) visible on the facing proposal?**
   - What we know: SunPitch generates proposals with financing options
   - What's unclear: Whether the customer-facing `/facing/` view shows raw financing terms or only monthly payment summaries
   - Recommendation: Mark `financing.*` fields as potentially missing (amber) unless confirmed. The scraper should optimistically attempt extraction and gracefully return them in `missingFields` if absent.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/app/api/pdf/route.ts` — Playwright API route pattern (Next.js runtime, chromium.launch args, try/finally)
- Existing codebase: `src/lib/form/schema.ts`, `src/lib/form/defaults.ts`, `src/lib/form/persistence.ts` — Form shape requirements and integration points
- `https://nextjs.org/docs/app/getting-started/route-handlers` (fetched 2026-03-03) — POST route handler pattern, `request.json()`, `export const runtime = 'nodejs'`
- `https://playwright.dev/docs/api/class-page` (fetched 2026-03-03) — `goto()`, `evaluate()`, locators
- `https://playwright.dev/docs/api/class-locator` (fetched 2026-03-03) — `waitFor()`, `textContent()`, `getAttribute()`, `innerText()`
- `https://react-hook-form.com/docs/useform/reset` (fetched 2026-03-03) — `reset()` API, options, async prefill pattern

### Secondary (MEDIUM confidence)
- `https://scrapfly.io/blog/how-to-capture-xhr-requests-playwright/` — `page.on('response')` interception pattern (cross-verified with Playwright docs)
- `https://www.browserless.io/blog/json-responses-with-puppeteer-and-playwright` — `waitForResponse` predicate pattern (Playwright-compatible)
- `https://blog.apify.com/scraping-single-page-applications-with-playwright/` — SPA scraping strategies: selector wait, function wait, response interception
- `https://proposals.fluentsolar.com` (fetched 2026-03-03) — SunPitch confirmed as JS-only SPA with Material fonts (no static data)
- `https://app.sunpitch.com` (fetched 2026-03-03) — Same: JavaScript-required preloader, no static HTML content

### Tertiary (LOW confidence)
- WebSearch: "SunPitch DOM structure" — no indexed results; DOM structure entirely unknown, must be discovered at implementation time
- WebSearch: "SunPitch authentication /facing/proposals" — no results; authentication requirement is unverified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Playwright already installed, proven in Phase 5; RHF reset() API is stable and well-documented
- Architecture: HIGH — `/api/scrape` POST route pattern is a direct copy of `/api/pdf`; ScrapeResult type and client-side highlight logic are straightforward
- Pitfalls: HIGH for general Playwright SPA pitfalls; LOW for SunPitch-specific pitfalls (unknown DOM, unknown auth)
- SunPitch DOM selectors: LOW — completely unknown; Wave 1 must start with discovery

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (Playwright/RHF stable; SunPitch DOM may change at any time — re-verify selectors if scraping breaks)
