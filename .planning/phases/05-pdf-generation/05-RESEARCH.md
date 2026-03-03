# Phase 5: PDF Generation - Research

**Researched:** 2026-03-03
**Domain:** Playwright PDF generation, Next.js App Router route handlers, CSS print media
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Invocation Architecture**
- API route `/api/pdf` — client passes the same `d` param (base64-encoded form values), API route spins up Playwright, navigates to the proposal, waits for full render, returns PDF buffer as `application/pdf` response
- Client-side download: response blob → `URL.createObjectURL()` → programmatic `<a>` click → PDF saved to disk
- Playwright runs inside the Next.js API route process (same Node.js server) — no separate PDF service needed for v1

**Print Layout**
- Separate `/proposal/pdf` route — identical to `/proposal` but with no ProposalFAB, no back/edit button, no scroll chrome
- Playwright navigates to `/proposal/pdf?d=<base64>` (not the interactive `/proposal` URL) — gives a clean, UI-chrome-free target
- The `/proposal/pdf` route is not linked from the app UI; it exists only as Playwright's render target
- Print CSS (`@media print`) on both routes as a fallback, but the PDF route is the primary mechanism

**Page Size & Breaks**
- US Letter (8.5×11") — standard for Alberta/Canada sales documents; use `format: 'Letter'` in Playwright `page.pdf()` options
- `printBackground: true` in Playwright options (required for background colors and gradients to appear)
- Each 100vh proposal page gets `break-after: page` (CSS) in the PDF route — one PDF page per proposal section
- No margin: `margin: { top: '0', right: '0', bottom: '0', left: '0' }` — full bleed matching web preview
- Pages use `width: 100vw; height: 100vh` in the PDF route, which maps to Letter dimensions at 96 DPI

**Font Loading**
- Wait for `networkidle` before capturing: `page.waitForLoadState('networkidle')` — ensures Google Fonts finish loading
- Additional `page.waitForTimeout(500)` safety buffer after networkidle for chart animations to settle
- If fonts fail to load (offline/CI), Playwright proceeds anyway — fallback fonts are acceptable for testing but not production

**Download UX & File Naming**
- Add to ProposalFAB as a 4th action item (primary action — appears first in the speed dial list, or as a prominent "Download PDF" button separate from the FAB)
- Loading state: FAB item shows spinner + "Generating..." while API route is working (disable re-click during generation)
- File name format: `NorthernNRG_[CustomerLastName]_[YYYY-MM-DD].pdf` — sorted alphabetically in file systems, branded, identifiable
- Error handling: if PDF generation fails (>30s timeout or Playwright crash), show a toast/inline error; don't leave user in silent failure

### Claude's Discretion
- Exact Playwright browser launch options (headless, args for sandboxing in various environments)
- Whether to cache the Playwright browser binary or install fresh each deploy
- How to pass the dev server URL to the API route (localhost:3001 in dev, production URL in prod — use `NEXT_PUBLIC_BASE_URL` env var or derive from request headers)
- Exact CSS for `break-after: page` and page height normalization in the PDF route
- Spinner/loading animation in the FAB

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROP-08 | PDF download that matches the web preview pixel-for-pixel | Playwright `page.pdf()` with `printBackground: true`, `emulateMedia('screen')`, `waitForLoadState('networkidle')`, and `break-after: page` CSS on each proposal section in the `/proposal/pdf` route delivers exact visual fidelity |
</phase_requirements>

---

## Summary

The PDF generation approach is architecturally simple: a Next.js App Router GET handler at `/api/pdf` receives the `d` query parameter, launches a Playwright Chromium browser, navigates to a dedicated `/proposal/pdf?d=<base64>` route (the same proposal with no interactive chrome), waits for full render, calls `page.pdf()` returning a Buffer, and streams it back as `application/pdf`. The client receives the blob, creates an object URL, and triggers a download via a programmatic anchor click. This is a well-established pattern supported by Playwright's official API.

Playwright 1.58.2 is already in `package.json` and its Chromium binary is installed at `C:\Users\David\AppData\Local\ms-playwright\chromium-1208\chrome-win64\chrome.exe`. No new dependencies are needed. The critical CSS insight is that `page.pdf()` applies `@media print` rules by default — so `emulateMedia({ media: 'screen' })` must be called before `page.pdf()` to preserve the proposal's screen-mode CSS. The other critical insight is that CSS background colors and gradients are stripped in print mode unless `printBackground: true` is set.

For page breaks, each `.proposal-page` element needs `break-after: page` in the `/proposal/pdf` route's stylesheet, and the `scroll-snap` behavior must be disabled (it has no effect in PDF rendering, but the `overflow: hidden` on `.proposal-page` could clip content). The PDF route reuses all 11 page components identically — it just omits the `ProposalFAB` and wraps in a non-snapping container.

**Primary recommendation:** Use `chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })`, call `page.emulateMedia({ media: 'screen' })` before `page.pdf()`, set `printBackground: true`, and add `break-after: page` CSS to each `.proposal-page` in the PDF route's layout.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| playwright | 1.58.2 (installed) | Headless Chromium, PDF generation | Already in package.json; only Chromium supports `page.pdf()` |
| next/server | (Next.js 16) | Route handler, NextRequest | App Router convention for API endpoints |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React (useState) | 19.x | Loading/error state in ProposalFAB | FAB is already a client component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright server-side PDF | react-pdf / @react-pdf/renderer | react-pdf builds PDFs programmatically but cannot match CSS/pixel-perfect web layout; Playwright renders exactly what the browser shows |
| Playwright server-side PDF | puppeteer | puppeteer is functionally equivalent but is a separate package — Playwright is already installed |
| Playwright server-side PDF | wkhtmltopdf / WeasyPrint | These are Python/C tools requiring separate installation; not appropriate for a Node.js API route |
| NEXT_PUBLIC_BASE_URL env var | Derive from request.headers.get('host') | Deriving from request headers works without env config but is less explicit; both patterns are valid |

**Installation:** No new packages needed. Playwright 1.58.2 and its Chromium binary are already present.

```bash
# Verify Chromium binary is present (already confirmed):
node -e "const { chromium } = require('playwright'); console.log(chromium.executablePath())"
# → C:\Users\David\AppData\Local\ms-playwright\chromium-1208\chrome-win64\chrome.exe
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── pdf/
│   │       └── route.ts         # GET handler: receives ?d=, launches Playwright, returns PDF buffer
│   └── proposal/
│       ├── pdf/
│       │   └── page.tsx         # PDF render target: same as /proposal/page.tsx minus ProposalFAB
│       ├── pages/               # All 11 page components (shared between /proposal and /proposal/pdf)
│       ├── ProposalFAB.tsx      # Modified: adds Download PDF action with loading state
│       └── proposal.css         # Existing shared CSS
```

### Pattern 1: Next.js App Router Route Handler Returning Binary PDF

**What:** A GET route handler that uses Playwright to render a page and returns the PDF buffer as a binary response.

**When to use:** Any time you need server-side PDF generation from a live URL.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route (verified)
// src/app/api/pdf/route.ts

import { NextRequest } from 'next/server';
import { chromium } from 'playwright';

export async function GET(request: NextRequest) {
  const d = request.nextUrl.searchParams.get('d');
  if (!d) {
    return new Response('Missing d parameter', { status: 400 });
  }

  // Derive base URL: prefer env var, fall back to request host
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? `http://${request.headers.get('host')}`;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // emulateMedia BEFORE goto — ensures screen CSS rules apply throughout load
    await page.emulateMedia({ media: 'screen' });

    await page.goto(`${baseUrl}/proposal/pdf?d=${encodeURIComponent(d)}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Extra safety buffer for chart animations / deferred rendering
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="proposal.pdf"',
      },
    });
  } finally {
    await browser.close();
  }
}
```

### Pattern 2: `/proposal/pdf` Route — Clean Render Target

**What:** A duplicate of `/proposal/page.tsx` that renders the same 11 pages without interactive UI, and with PDF-specific CSS.

**When to use:** Always — Playwright navigates here, not to the interactive `/proposal` URL.

```typescript
// src/app/proposal/pdf/page.tsx
// Identical to src/app/proposal/page.tsx EXCEPT:
// 1. No <ProposalFAB />
// 2. Imports pdf-specific CSS overrides (see Pattern 3)
// 3. Container class: proposal-pdf-root instead of proposal-root proposal-snap-container

import './pdf.css';  // PDF-specific overrides
// ... same imports as proposal/page.tsx ...

export default async function ProposalPdfPage({ searchParams }) {
  // ... identical data fetching and computation as proposal/page.tsx ...

  return (
    <div className="proposal-root proposal-pdf-root">
      <CoverPage ... />
      <TableOfContentsPage />
      {/* ... all 11 pages ... */}
      {/* NO <ProposalFAB /> */}
    </div>
  );
}
```

### Pattern 3: PDF CSS Overrides (`pdf.css`)

**What:** A small CSS file scoped to `.proposal-pdf-root` that configures page breaks and disables scroll-snap.

**When to use:** Applied only in the `/proposal/pdf` route.

```css
/* src/app/proposal/pdf/pdf.css */

/* Disable scroll snap — irrelevant in PDF context */
.proposal-pdf-root {
  height: auto;
  overflow: visible;
  scroll-snap-type: none;
}

/* Each proposal page breaks onto a new PDF page */
.proposal-pdf-root .proposal-page {
  scroll-snap-align: none;
  scroll-snap-stop: normal;
  break-after: page;
  overflow: visible;  /* prevent content clipping */
}

/* Ensure last page doesn't create a blank trailing page */
.proposal-pdf-root .proposal-page:last-child {
  break-after: avoid;
}

/* Force exact color reproduction */
.proposal-pdf-root * {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

### Pattern 4: Client-Side Download Trigger in ProposalFAB

**What:** Fetch the API route, receive the blob, create a temporary object URL, and simulate an anchor click to download.

**When to use:** Standard browser pattern for downloading binary API responses.

```typescript
// In ProposalFAB.tsx — add download handler
const [isGenerating, setIsGenerating] = useState(false);
const [pdfError, setPdfError] = useState<string | null>(null);

async function handleDownloadPdf() {
  setIsGenerating(true);
  setPdfError(null);
  try {
    const response = await fetch(`/api/pdf?d=${encodeURIComponent(currentD)}`, {
      signal: AbortSignal.timeout(35000), // 35s client timeout
    });
    if (!response.ok) throw new Error(`PDF generation failed: ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Derive customer last name for file name
    const lastName = customerName.split(' ').pop() ?? 'Customer';
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `NorthernNRG_${lastName}_${date}.pdf`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    setPdfError('PDF generation failed. Please try again.');
  } finally {
    setIsGenerating(false);
  }
}
```

### Anti-Patterns to Avoid

- **Calling `page.pdf()` without `emulateMedia('screen')` first:** The default PDF rendering uses `@media print` CSS, which strips backgrounds and may apply different layout rules. The proposal CSS has no `@media print` overrides — it was designed for screen. Always call `emulateMedia` before navigating.
- **Using `waitUntil: 'load'` instead of `'networkidle'`:** Google Fonts load asynchronously after the `load` event. `networkidle` waits for network activity to stop, ensuring fonts are fully loaded before capture.
- **Navigating to `/proposal` (interactive URL) instead of `/proposal/pdf`:** The interactive route includes ProposalFAB and scroll-snap behavior that should not appear in the PDF.
- **Not calling `browser.close()` in a `finally` block:** Leaked browser processes will exhaust server memory over time.
- **Passing the `path` option to `page.pdf()`:** Writing to disk in a Next.js API route is not reliable. Always omit `path` to receive the Buffer directly.
- **Using `overflow: hidden` on `.proposal-page` in the PDF route:** The existing CSS has `overflow: hidden` on `.proposal-page`. In PDF context this clips content. The `pdf.css` override must set `overflow: visible`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headless browser PDF | Custom puppeteer setup | `playwright` (already installed) | Playwright is already in package.json at 1.58.2 with Chromium binary present |
| CSS color preservation in print | Custom color filter | `-webkit-print-color-adjust: exact` CSS property | Browser vendors handle this; custom filtering produces wrong colors |
| Client-side download of binary | Base64 encode + decode | `URL.createObjectURL(blob)` browser API | Native browser API, no encoding overhead, works with any binary size |
| PDF page break detection | JavaScript scroll measurement | CSS `break-after: page` | CSS paged media is the authoritative mechanism; JS hacks are fragile |
| Font embedding | Subset fonts, encode to base64 | Playwright embeds referenced Google Fonts automatically | Playwright captures whatever fonts the browser loaded; no manual work needed |

**Key insight:** Playwright's `page.pdf()` is essentially "print to PDF" from Chromium — it handles all the complexity of font embedding, color management, and page layout that custom solutions always get wrong.

---

## Common Pitfalls

### Pitfall 1: Print Media CSS Strips Backgrounds
**What goes wrong:** All background colors, gradients, and images disappear from the PDF. The proposal looks like a white document with just text.
**Why it happens:** `page.pdf()` defaults to `@media print` which browsers historically strip backgrounds from for ink-saving. Additionally, background colors need `printBackground: true`.
**How to avoid:** Two-part fix: (1) call `page.emulateMedia({ media: 'screen' })` before `page.goto()`, AND (2) set `printBackground: true` in `page.pdf()` options. Both are required.
**Warning signs:** PDF shows white backgrounds where the web preview shows green/blue/dark panels.

### Pitfall 2: Blank Extra Page at End of PDF
**What goes wrong:** PDF has 12 pages instead of 11 — an empty page at the end.
**Why it happens:** `break-after: page` on the last `.proposal-page` creates a page break after it, which generates a trailing blank page.
**How to avoid:** Apply `break-after: avoid` (or `break-after: auto`) on `.proposal-page:last-child` in `pdf.css`.
**Warning signs:** PDF page count is one more than expected.

### Pitfall 3: Content Clipped Due to `overflow: hidden`
**What goes wrong:** Some proposal pages have content slightly cut off or missing in the PDF.
**Why it happens:** `.proposal-page` has `overflow: hidden` in `proposal.css`, which is correct for the scroll-snap web view but clips overflowing content in the flat PDF layout.
**How to avoid:** The `pdf.css` override must include `overflow: visible` on `.proposal-page` within `.proposal-pdf-root`.
**Warning signs:** Specific pages look truncated at the bottom or right edge in the PDF.

### Pitfall 4: Fonts Not Loading Before PDF Capture
**What goes wrong:** PDF shows fallback system fonts instead of Bebas Neue, DM Sans, or Montserrat.
**Why it happens:** Google Fonts load asynchronously. If Playwright captures before fonts arrive, the PDF uses system fallbacks.
**How to avoid:** Use `waitUntil: 'networkidle'` in `page.goto()` options, plus a 500ms `waitForTimeout` buffer. In dev (localhost) fonts load fast; in production or slow networks the buffer matters more.
**Warning signs:** Typography in PDF looks different from web preview — wider/thinner letterforms, different weight.

### Pitfall 5: Chromium Sandbox Errors on Some Environments
**What goes wrong:** `chromium.launch()` throws an error about sandbox, or the browser silently fails to start.
**Why it happens:** Linux servers and Docker containers often lack the kernel capabilities Chromium's security sandbox requires. Windows development environments can also hit this.
**How to avoid:** Always launch with `args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']`. The security tradeoff is acceptable because Playwright is navigating to our own trusted URL, not arbitrary user-provided URLs.
**Warning signs:** API route returns 500 with a message about "No usable sandbox" or "Failed to launch browser".

### Pitfall 6: Self-Referential URL Resolution in Dev
**What goes wrong:** The API route at `/api/pdf` tries to navigate Playwright to `http://localhost:3001/proposal/pdf?d=...` but uses the wrong port or protocol.
**Why it happens:** The dev server runs on port 3001 (per package.json). If `NEXT_PUBLIC_BASE_URL` is not set, the URL must be derived from request headers.
**How to avoid:** Set `NEXT_PUBLIC_BASE_URL=http://localhost:3001` in `.env.local` for dev. For production, set it to the production domain. Alternatively, derive from `request.headers.get('host')` with protocol detection.
**Warning signs:** Playwright times out waiting for the page; the API route hangs until the 30s timeout.

### Pitfall 7: Next.js Route Handler Runtime Timeout
**What goes wrong:** Next.js terminates the route handler before Playwright finishes (default timeout for serverless functions is often 10s).
**Why it happens:** PDF generation takes 5-15 seconds. Vercel and other serverless platforms have short function timeout limits.
**How to avoid:** In `route.ts`, export `export const maxDuration = 60;` (Vercel Pro) or `export const runtime = 'nodejs'` to ensure the Node.js runtime is used (not Edge runtime). Playwright cannot run in Edge runtime.
**Warning signs:** PDF generation works locally but times out in production deployment.

---

## Code Examples

Verified patterns from official sources:

### Complete API Route Handler
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route (official Next.js docs)
// src/app/api/pdf/route.ts

import { NextRequest } from 'next/server';
import { chromium } from 'playwright';

// REQUIRED: Playwright cannot run in Edge runtime
export const runtime = 'nodejs';
// OPTIONAL: Extend timeout for serverless platforms (Vercel Pro)
// export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const d = request.nextUrl.searchParams.get('d');
  if (!d) {
    return new Response('Missing d parameter', { status: 400 });
  }

  const host = request.headers.get('host') ?? 'localhost:3001';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}://${host}`;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // CRITICAL: emulateMedia before goto to apply screen CSS throughout load
    await page.emulateMedia({ media: 'screen' });

    await page.goto(
      `${baseUrl}/proposal/pdf?d=${encodeURIComponent(d)}`,
      { waitUntil: 'networkidle', timeout: 30000 }
    );

    // Safety buffer: chart animations, deferred renders
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="proposal.pdf"',
      },
    });
  } finally {
    await browser.close();
  }
}
```

### PDF CSS Overrides
```css
/* Source: MDN break-after (https://developer.mozilla.org/docs/Web/CSS/break-after)
   Applied only in /proposal/pdf route */

/* Disable scroll-snap layout for flat PDF rendering */
.proposal-pdf-root {
  height: auto;
  overflow: visible;
  scroll-snap-type: none;
}

.proposal-pdf-root .proposal-page {
  scroll-snap-align: none;
  scroll-snap-stop: normal;
  break-after: page;
  overflow: visible;   /* CRITICAL: un-clip content hidden by scroll-snap CSS */
}

/* Prevent blank trailing page */
.proposal-pdf-root .proposal-page:last-child {
  break-after: auto;
}

/* Force exact color reproduction (backgrounds, gradients) */
.proposal-pdf-root * {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

### Client-Side Blob Download
```typescript
// Source: Standard browser File API (MDN: URL.createObjectURL)
// This pattern is framework-agnostic and works in any React component

async function downloadPdf(d: string, customerName: string) {
  const response = await fetch(`/api/pdf?d=${encodeURIComponent(d)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const lastName = customerName.trim().split(/\s+/).pop() ?? 'Customer';
  const date = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `NorthernNRG_${lastName}_${date}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke after short delay to ensure download started
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `page-break-after: always` | `break-after: page` | CSS Fragmentation Level 3 (current) | Old property is deprecated but still works; use modern property |
| puppeteer for PDF | playwright (chromium) | 2020+ | Playwright supersedes puppeteer for new projects; API is nearly identical |
| Server-rendered PDF libraries (pdfmake, jsPDF) | Headless browser PDF | 2019+ | Browser-based PDF matches web preview exactly; layout libraries can't |
| `waitUntil: 'load'` | `waitUntil: 'networkidle'` | Long-standing best practice | `networkidle` ensures async assets (fonts, images) are fully loaded |

**Deprecated/outdated:**
- `page-break-after: always`: Old CSS2 property — still works but `break-after: page` is the modern standard
- `page.emulateMedia('screen')`: Old Playwright API — current API is `page.emulateMedia({ media: 'screen' })` (object argument)

---

## Open Questions

1. **Recharts SSR/hydration in PDF route**
   - What we know: Recharts components use `dynamic(() => import(...), { ssr: false })` in the existing proposal. This means they render client-side only.
   - What's unclear: Will Playwright (running a real Chromium browser) execute the client-side JavaScript and render the Recharts charts? Yes — Playwright runs a full browser with JS, so `ssr: false` dynamic imports will hydrate and render. The `waitForLoadState('networkidle')` + 500ms buffer should be sufficient.
   - Recommendation: Verify charts appear in the PDF during manual testing. If they do not render (race condition), increase `waitForTimeout` to 1000ms.

2. **`d` parameter passthrough from ProposalFAB**
   - What we know: ProposalFAB is rendered inside `/proposal/page.tsx` which receives `searchParams`. The FAB does not currently receive the `d` param.
   - What's unclear: How does the FAB know the current `d` value to pass to `/api/pdf?d=`?
   - Recommendation: Pass `d` as a prop from `ProposalPage` to `ProposalFAB`, or read it from `window.location.search` inside the FAB (it's a client component so `window` is available).

3. **Viewport size for PDF rendering**
   - What we know: Playwright's default viewport is 1280×720. The proposal pages use `100vh` and `100vw`. In PDF rendering, Playwright maps `vw`/`vh` to the paper dimensions at 96 DPI (Letter = 816×1056px).
   - What's unclear: Whether the default Playwright viewport causes layout issues with the 1600px max-width `proposal-inner` constraint.
   - Recommendation: Set `page.setViewportSize({ width: 816, height: 1056 })` before `goto()` to exactly match Letter dimensions at 96 DPI. This ensures `vw`/`vh` units resolve correctly.

---

## Sources

### Primary (HIGH confidence)
- https://playwright.dev/docs/api/class-page#page-pdf — Official Playwright `page.pdf()` API, verified format/printBackground/margin options, Buffer return type
- https://playwright.dev/docs/api/class-browsertype#browser-type-launch — Official Playwright `chromium.launch()` options, headless/args/chromiumSandbox verified
- https://nextjs.org/docs/app/api-reference/file-conventions/route (version 16.1.6, lastUpdated 2026-02-27) — Next.js App Router route handler binary response pattern, `new Response(buffer, { headers })` verified
- Playwright version confirmed: `playwright@1.58.2` in package.json; Chromium binary confirmed at `C:\Users\David\AppData\Local\ms-playwright\chromium-1208\chrome-win64\chrome.exe`

### Secondary (MEDIUM confidence)
- https://www.checklyhq.com/docs/learn/playwright/generating-pdfs/ — Confirmed `printBackground: true` requirement, `emulateMedia` usage pattern; verified against official Playwright docs
- https://github.com/microsoft/playwright/issues/20565 — PDF page cutoff regression in Playwright 1.28+ due to LayoutNGPrinting Chromium change (closed as not planned; current Playwright 1.58.2 may have resolved upstream)
- MDN CSS `break-after` property — `break-after: page` is the modern standard (deprecates `page-break-after`)
- MDN `-webkit-print-color-adjust` — CSS property for forcing exact color reproduction in print/PDF contexts

### Tertiary (LOW confidence)
- GitHub issue #3191 (Playwright) — `--no-sandbox` required for Windows in some environments; confirmed pattern but context was older Playwright versions. Retained as standard practice.
- Community pattern for deriving base URL from `request.headers.get('host')` — widely used, not in official docs, but logically sound

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Playwright 1.58.2 confirmed installed with Chromium binary; Next.js 16 route handler pattern verified from official docs
- Architecture: HIGH — All patterns verified from official Playwright and Next.js docs; API signatures confirmed
- Pitfalls: HIGH for Pitfalls 1-6 (verified from official docs or GitHub issues); MEDIUM for Pitfall 7 (serverless timeout is deployment-dependent)
- CSS page breaks: MEDIUM — `break-after: page` is verified by MDN; interaction with existing `overflow: hidden` on `.proposal-page` identified from reading proposal.css directly, but exact behavior in Playwright PDF context should be validated manually

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (Playwright APIs are stable; Next.js route handler API confirmed at 16.1.6)
