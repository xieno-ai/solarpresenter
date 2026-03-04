# Phase 7: Bill Extraction - Research

**Researched:** 2026-03-04
**Domain:** AI document extraction (Gemini), Next.js file upload, React copy-to-clipboard UX
**Confidence:** HIGH (core stack verified via official docs; architecture patterns verified against existing codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Landing Page (/)**
- Card grid layout — each tool is a card with name + one-line description
- Open access — no login required (consistent with current app)
- Extensible: adding future tools means adding cards, no structural change needed
- Two cards at launch: "Proposal Creator" (→ /proposal) and "Bill Extractor" (→ /bill)

**Route Structure**
- `/` — landing hub
- `/proposal` — proposal creator (rename from `/enter`)
- `/bill` — bill extractor (new)
- Any existing `/enter` links should redirect to `/proposal`

**AI Service**
- **Gemini Flash** (latest available model at implementation time) via Google Generative AI SDK
- Chosen for native PDF support — no PDF-to-image conversion step needed
- Accepts: PDF, JPG, PNG, HEIC

**Extraction Fields**
Full extraction — AI attempts all of:
- Monthly electricity usage (kWh) × 12 months
- Annual electricity usage (kWh total)
- All-in rate (¢/kWh)
- Energy/commodity rate (¢/kWh)
- Utility provider name
- Account holder name
- Service address

**Result UX**
- After upload + processing, the upload UI **swaps out** and the extracted values card **replaces it** in place — no navigation, no scroll
- "Re-upload" option available to try again
- **Missing fields** shown with "Not found" label in amber — same visual language as Phase 6's amber highlight for scrape gaps
- **Copy UX**: per-field copy button on each value + "Copy all as text" button at the top/bottom of the card
- "Copy all" formats as plain text block (e.g. label: value pairs) suitable for pasting into notes or email

**Loading Experience**
- Step-by-step status messages during extraction (5–15 second wait):
  - "Uploading bill..."
  - "Reading document..."
  - "Extracting usage data..."
  - "Extracting rate information..."
  - "Finalizing results..."
- Same pattern as SunPitch scraping — makes wait feel like progress

### Claude's Discretion
- Exact Gemini model ID (use latest Flash at implementation time)
- Gemini API prompt design and structured output schema
- File size limits and validation messaging
- Error handling for unreadable bills (corrupt file, non-bill document uploaded)
- Exact copy-all text format
- Landing page card visual design (within the project's dark theme)
- Whether `/enter` redirects (301) or is removed entirely

### Deferred Ideas (OUT OF SCOPE)
- **Auth + user accounts + saved history** — user wants login and the ability to review past proposals and extracted bills. Significant new capability requiring auth infrastructure. Future phase after current roadmap.
- **Bill extraction → proposal form pre-fill** — original Phase 7 roadmap goal. User chose standalone tool instead. Could be re-added as a "connect" feature once both tools are stable.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPUT-04 | User can upload a utility bill (PDF, photo, or scan) and AI extracts electricity usage, utility company, energy rate, all-in rate, account holder, and service address | Gemini Flash + `@google/genai` SDK supports PDF/JPG/PNG/HEIC inline data; structured output via `responseSchema` + Zod guarantees typed extraction |
| INPUT-05 | Bill extraction outputs data in a structured format ready to input into SunPitch or populate the manual entry form | `ExtractedBillFields` type mirrors `ProposalFormValues` field names; copy-all text format designed for pasting into any tool |
</phase_requirements>

---

## Summary

Phase 7 delivers two discrete deliverables: a landing page hub at `/` and a standalone Bill Extractor tool at `/bill`. The landing page replaces the current smoke test page with a card grid. The Bill Extractor uploads a utility bill (PDF/image), sends it to Gemini Flash for AI extraction, and displays structured results with per-field copy buttons — no form pre-fill, no navigation.

The AI stack is fully decided: `@google/genai` (the official Google GenAI SDK, GA since May 2025) with inline file data sent as base64. Gemini Flash natively reads PDFs and images, requiring no intermediate conversion step. Structured output is enforced via `responseSchema` + Zod, guaranteeing a typed `ExtractedBillFields` object back from the model.

The critical architectural constraint is Vercel's 4.5MB body size limit on serverless functions. Utility bills as PDFs rarely exceed 2MB, and JPG/PNG photos of bills rarely exceed 4MB if the user's camera compresses them. The implementation must validate file size client-side (≤ 4MB) before upload to prevent opaque 413 errors from Vercel. The route handler reads the file via `request.formData()` and converts to a base64 string for Gemini inline data — no external storage required for this use case.

**Primary recommendation:** Use `@google/genai` with inline base64 data (no Files API needed for bill-sized documents), Gemini Flash (`gemini-2.5-flash` or latest at implementation), Zod schema for structured output, and mirror the `SunPitchTab` loading pattern exactly for the extraction UX.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/genai` | ^1.43.0 | Google Generative AI SDK — calls Gemini Flash with file + structured output | Official GA SDK (replaced legacy `@google/generative-ai`); first-party, actively maintained |
| `zod` | ^4.3.6 (already installed) | Define and validate extracted field schema | Already in project; official Gemini docs recommend Zod for structured output |
| `zod-to-json-schema` | ^3.x | Convert Zod schema → JSON Schema for `responseSchema` config | Required bridge between Zod and Gemini's `responseSchema` parameter |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `navigator.clipboard.writeText` | Web API | Copy individual field value to clipboard | Per-field copy button — no library needed |
| Native `request.formData()` | Next.js built-in | Read multipart file upload in route handler | Standard App Router file upload pattern |
| `Buffer.from(await file.arrayBuffer()).toString('base64')` | Node.js built-in | Convert File to base64 for Gemini inline data | In the route handler before Gemini call |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@google/genai` inline data | Gemini Files API | Files API adds polling loop + async state management; inline is simpler for ≤ 4MB bills |
| Zod-based structured output | Manual JSON parsing | Zod gives compile-time type safety and runtime validation; manual parsing can silently fail |
| `@google/genai` | Vercel AI SDK (`ai` + `@ai-sdk/google`) | AI SDK adds abstraction for multi-provider; overkill for single-provider use case in this project |

**Installation:**
```bash
npm install @google/genai zod-to-json-schema
```

> Note: `zod` is already installed at ^4.3.6.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                    # REPLACE: Landing hub (card grid)
│   ├── proposal/                   # EXISTING: stays (proposal renderer)
│   ├── enter/                      # EXISTING: stays OR redirects to /proposal
│   └── bill/
│       └── page.tsx                # NEW: Bill Extractor page ('use client')
├── api/
│   └── extract-bill/
│       └── route.ts                # NEW: POST handler — receives file, calls Gemini, returns ExtractedBillFields
└── lib/
    └── bill/
        ├── schema.ts               # NEW: Zod schema for ExtractedBillFields + type export
        └── prompt.ts               # NEW: Gemini prompt string (kept separate for easy tuning)
```

### Pattern 1: File Upload Route Handler

**What:** Next.js App Router route handler that receives a multipart/form-data POST, converts the file to base64, calls Gemini, and returns structured JSON.

**When to use:** Any server-side AI processing of uploaded files.

```typescript
// Source: Official Next.js App Router docs + Gemini API docs
// File: src/app/api/extract-bill/route.ts

import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { extractedBillSchema } from '@/lib/bill/schema';

export const runtime = 'nodejs';
export const maxDuration = 60; // Gemini typically responds in 5-15s; 60s safety margin

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

export async function POST(request: NextRequest): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ status: 'error', message: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return Response.json({ status: 'error', message: 'No file provided' }, { status: 400 });
  }

  // Convert to base64 for Gemini inline data
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // or latest Flash at implementation time
    contents: [
      { text: BILL_EXTRACTION_PROMPT },
      { inlineData: { mimeType: file.type, data: base64Data } },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: zodToJsonSchema(extractedBillSchema),
    },
  });

  const fields = extractedBillSchema.parse(JSON.parse(response.text ?? '{}'));
  return Response.json({ status: 'success', fields });
}
```

### Pattern 2: Zod Schema for Extracted Fields

**What:** Define `ExtractedBillFields` as a Zod object with nullable fields (extraction may miss some values).

**When to use:** Whenever AI returns structured data — Zod validates at the boundary and produces a typed object.

```typescript
// Source: Official Gemini structured output docs
// File: src/lib/bill/schema.ts

import { z } from 'zod';

// Each field is nullable — AI may not find all values in every bill
export const extractedBillSchema = z.object({
  // Monthly consumption — preferred (12 values or null if not found)
  monthlyKwh: z.array(z.number().nullable()).length(12).nullable(),
  // Annual total — fallback if monthly not available
  annualKwh: z.number().nullable(),
  // Rates
  allInRateCentsPerKwh: z.number().nullable(),     // All-in effective rate ¢/kWh
  energyRateCentsPerKwh: z.number().nullable(),    // Commodity/energy-only rate ¢/kWh
  // Provider info
  utilityProvider: z.string().nullable(),
  accountHolderName: z.string().nullable(),
  serviceAddress: z.string().nullable(),
});

export type ExtractedBillFields = z.infer<typeof extractedBillSchema>;

// API response envelope (mirrors ScrapeResult shape)
export interface ExtractBillResult {
  status: 'success' | 'partial' | 'error';
  fields: ExtractedBillFields | null;
  message?: string;
}
```

### Pattern 3: Loading State — Mirror SunPitchTab

**What:** Array of status messages cycled via `setInterval` during async processing. Spinner + step list with completed/current/future indicators.

**When to use:** Any async operation taking 5-30 seconds.

```typescript
// Source: src/app/enter/components/SunPitchTab.tsx (existing — copy this pattern)
const STATUS_MESSAGES = [
  'Uploading bill...',
  'Reading document...',
  'Extracting usage data...',
  'Extracting rate information...',
  'Finalizing results...',
];

// In useEffect:
if (isLoading) {
  setStatusIndex(0);
  intervalRef.current = setInterval(() => {
    setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
  }, 2500);
}
```

### Pattern 4: Per-Field Copy Button

**What:** Inline button per extracted value that calls `navigator.clipboard.writeText()`, shows brief "Copied!" feedback, then resets.

**When to use:** Any "copy to clipboard" feature.

```typescript
// Source: MDN Web API (navigator.clipboard.writeText)
// No library needed — pure Web API
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={handleCopy} className="...">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

### Pattern 5: Upload → Results Swap

**What:** Single view with `phase` state: `'upload' | 'loading' | 'results'`. When `phase === 'results'`, the upload UI unmounts and the results card mounts in its place. "Re-upload" button resets state to `'upload'`.

**When to use:** Single-page tool where the result replaces the input form.

```typescript
// Phase state drives what's rendered
type Phase = 'upload' | 'loading' | 'results';
const [phase, setPhase] = useState<Phase>('upload');
const [result, setResult] = useState<ExtractedBillFields | null>(null);

// On submit: setPhase('loading') → fetch → setResult(fields) → setPhase('results')
// On "Re-upload": setResult(null) → setPhase('upload')
```

### Anti-Patterns to Avoid
- **Storing uploaded file in React state:** Files are large blobs; pass directly to FormData and fetch, don't hold in useState.
- **Parsing Gemini response without Zod validation:** `JSON.parse(response.text)` alone can produce runtime errors when fields are missing or typed differently.
- **Using Files API for small bills:** The Files API requires polling until the file state is `PROCESSING → ACTIVE`, adding complexity and latency. Inline base64 is simpler and sufficient for bills under 4MB.
- **Auto-navigating after extraction:** User decision is explicit: the results card swaps in-place. Do not use `router.push()` after extraction completes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured JSON from AI | Custom regex/parser on Gemini text response | Gemini `responseSchema` + Zod | AI text output is inconsistent; structured output guarantees valid JSON matching your schema |
| Base64 encoding | Custom encoding loop | `Buffer.from(arrayBuffer).toString('base64')` | Node.js built-in; zero dependencies |
| Copy to clipboard | `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Modern async API, no deprecated execCommand, simpler error handling |
| File type validation | Custom MIME sniffing | `file.type` check + size check client-side before fetch | Browser sets MIME correctly; client validation prevents wasted API calls |

**Key insight:** The hardest part of bill extraction is prompt engineering and field naming, not the plumbing. The SDK, schema validation, and clipboard are all native — invest effort in the Gemini prompt and the null-field display UX.

---

## Common Pitfalls

### Pitfall 1: Vercel 4.5MB Body Limit
**What goes wrong:** User uploads a high-resolution photo of their bill. The POST to `/api/extract-bill` returns a 413 or silent failure because Vercel's serverless function body limit is 4.5MB.
**Why it happens:** Vercel caps request bodies at 4.5MB for all serverless functions by default. The App Router has no per-route override without `experimental.serverActions.bodySizeLimit` (global only).
**How to avoid:** Validate file size client-side before the fetch call. Set a limit of 4MB to leave margin. Display a friendly error: "File too large — please compress the image or use a smaller scan."
**Warning signs:** Silent 413 errors in Vercel logs, fetch throwing network error without useful message.

### Pitfall 2: `@google/generative-ai` vs `@google/genai` Confusion
**What goes wrong:** Developer installs the legacy `@google/generative-ai` package (still published on npm) instead of the current `@google/genai`.
**Why it happens:** Both packages exist on npm; the old one still has many tutorials referencing it.
**How to avoid:** Always install `@google/genai`. The new SDK uses `GoogleGenAI` class and `ai.models.generateContent()`. The legacy SDK used `GoogleGenerativeAI` with `getGenerativeModel()`. Check for `@google/genai` in package.json.
**Warning signs:** Import paths like `import { GoogleGenerativeAI } from '@google/generative-ai'` — this is the old SDK.

### Pitfall 3: Gemini Model ID Staleness
**What goes wrong:** Code is written with `gemini-2.0-flash` — that model retires June 1, 2026 (confirmed by Google changelog). After retirement, calls fail.
**Why it happens:** Model IDs change frequently; tutorials use whatever was current at time of writing.
**How to avoid:** Use `gemini-2.5-flash` or the latest stable Flash model at implementation time. Store the model ID in a constant or environment variable so it can be updated without code changes.
**Warning signs:** API errors about deprecated model after deployment.

### Pitfall 4: Missing Nullable Fields Crash the UI
**What goes wrong:** Gemini returns `null` for `monthlyKwh` (couldn't find monthly data), but the results card tries to map over it and crashes.
**Why it happens:** AI extraction is inherently partial — some bills don't have all 12 months or don't show the energy-only rate.
**How to avoid:** Every field in `ExtractedBillFields` must be `nullable`. The results card must check each value before rendering and show the amber "Not found" badge for null values. Test with a minimal Gemini response where most fields are null.
**Warning signs:** TypeError on render when Gemini returns partial extraction.

### Pitfall 5: Route Collision — `/proposal` vs Existing `src/app/proposal/`
**What goes wrong:** The plan renames `/enter` → `/proposal`, but `src/app/proposal/` already exists as the proposal renderer. Two routes cannot share the same directory.
**Why it happens:** The CONTEXT.md explicitly flagged this collision. The proposal renderer lives at `src/app/proposal/`, so renaming the form to `/proposal` would overwrite or conflict.
**How to avoid:** Keep the form at `/enter` and add a redirect from `/proposal` to `/enter` using Next.js `redirect()` in a route handler OR rename the renderer to `/view` and the form to `/proposal`. The planner must pick one approach and commit. CONTEXT.md suggests keeping `/enter` with a redirect is simplest.
**Warning signs:** Next.js build error about conflicting routes.

### Pitfall 6: Clipboard API Requires Secure Context
**What goes wrong:** `navigator.clipboard.writeText()` silently fails or throws in non-HTTPS environments.
**Why it happens:** The Clipboard API requires a secure context (HTTPS or localhost). This works fine on Vercel and local dev but fails if anyone tests on plain HTTP.
**How to avoid:** Wrap in try/catch. Log the error. On failure, fall back to selecting text from a hidden input and `document.execCommand('copy')` for resilience.
**Warning signs:** Copy buttons appear to work but nothing is in clipboard when tested on non-HTTPS.

---

## Code Examples

Verified patterns from official sources:

### Gemini Inline PDF/Image Request
```typescript
// Source: https://ai.google.dev/gemini-api/docs/document-processing
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'Extract the electricity usage and rate data from this utility bill.' },
    {
      inlineData: {
        mimeType: 'application/pdf',  // or 'image/jpeg', 'image/png', 'image/heic'
        data: Buffer.from(pdfBuffer).toString('base64'),
      },
    },
  ],
  config: {
    responseMimeType: 'application/json',
    responseSchema: zodToJsonSchema(extractedBillSchema),
  },
});

const fields = extractedBillSchema.parse(JSON.parse(response.text ?? '{}'));
```

### Next.js Route Handler — File Ingestion
```typescript
// Source: Next.js App Router docs (request.formData())
export async function POST(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return Response.json({ status: 'error', message: 'No file uploaded' }, { status: 400 });
  }

  // Client should enforce this, but double-check server-side
  if (file.size > 4 * 1024 * 1024) {
    return Response.json({ status: 'error', message: 'File exceeds 4MB limit' }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  // ... pass to Gemini
}
```

### Client-Side File Upload with FormData
```typescript
// Source: Standard Web API pattern
async function handleUpload(file: File) {
  if (file.size > 4 * 1024 * 1024) {
    setError('File too large. Please use a file under 4MB.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/extract-bill', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header — browser sets boundary automatically
  });

  const result: ExtractBillResult = await response.json();
}
```

### Suggested Gemini Extraction Prompt
```typescript
// File: src/lib/bill/prompt.ts
export const BILL_EXTRACTION_PROMPT = `
You are an expert at reading Alberta utility bills (electricity).

Extract the following fields from the provided utility bill document:
- monthlyKwh: Array of 12 monthly electricity consumption values in kWh (January through December order). If only some months are present, fill missing months with null. If no monthly data exists, return null for the whole array.
- annualKwh: Total annual electricity consumption in kWh. If not explicitly stated, sum monthlyKwh if available.
- allInRateCentsPerKwh: The effective all-in rate in cents per kWh (total bill amount ÷ total kWh). This is NOT just the energy charge — it includes all fees and charges.
- energyRateCentsPerKwh: The energy or commodity rate only (excluding distribution, transmission, and other fixed charges), in cents per kWh.
- utilityProvider: The name of the electricity utility company (e.g., "EPCOR", "ENMAX", "ATCOenergy").
- accountHolderName: The name of the account holder as shown on the bill.
- serviceAddress: The service or delivery address shown on the bill (where electricity is delivered, not the mailing address if different).

Return null for any field you cannot find or are not confident about.
Alberta rates are typically 14-25 cents/kWh all-in. If you see values far outside this range, double-check your extraction.
`;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` (legacy SDK) | `@google/genai` (official GA SDK) | May 2025 | Different import paths and API shape; use `@google/genai` |
| `gemini-2.0-flash` | `gemini-2.5-flash` (or `gemini-3-flash-preview` if stable) | 2025-2026 | 2.0 Flash retires June 1, 2026; use 2.5 Flash minimum |
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | 2020+ | execCommand deprecated; async Clipboard API is standard |
| Files API polling for all uploads | Inline base64 for small files | Always existed | Inline is simpler for < 50MB; use Files API only for reused/large files |
| Manual JSON parsing of AI responses | Structured output with `responseSchema` | 2024+ | Guaranteed valid JSON matching schema; eliminates parse errors |

**Deprecated/outdated:**
- `@google/generative-ai`: Legacy SDK, still published but no new features. Do not install this package.
- `gemini-2.0-flash` model ID: Retires June 1, 2026. Use `gemini-2.5-flash`.
- `document.execCommand('copy')`: Deprecated across all browsers. Use `navigator.clipboard.writeText()`.

---

## Open Questions

1. **Route collision resolution: `/enter` rename vs redirect**
   - What we know: `src/app/proposal/` is the proposal renderer; renaming `/enter` → `/proposal` collides directly. CONTEXT.md says "keep `/enter` URL, add redirect" is an option.
   - What's unclear: User said "rename from `/enter`" in decisions but the CONTEXT.md code notes flag the collision clearly.
   - Recommendation: Keep the form at `/enter` URL. Add a Next.js `redirect()` route at `/proposal` that points to `/enter`. The landing hub card for "Proposal Creator" links to `/enter`. This is the path of least resistance and requires zero file moves.

2. **Gemini model ID at implementation time**
   - What we know: `gemini-2.5-flash` is stable as of early 2026; `gemini-3-flash-preview` exists but "preview" suggests non-GA.
   - What's unclear: Whether `gemini-2.5-flash` is the right stable model ID string at the moment of implementation.
   - Recommendation: At implementation time, check `https://ai.google.dev/gemini-api/docs/models` for the latest stable Flash model. Store as a constant: `const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'` so it can be overridden without code changes.

3. **Monthly kWh extraction confidence**
   - What we know: Alberta utility bills vary significantly across providers. Some show 12-month history; many only show the current month.
   - What's unclear: How reliably Gemini extracts monthly arrays from single-month bills (it may only return 1 of 12 as non-null).
   - Recommendation: Design the results card to gracefully handle sparse monthly arrays (mostly null). Show a summary row like "1 of 12 months found" rather than hiding the whole monthly section.

---

## Sources

### Primary (HIGH confidence)
- `https://ai.google.dev/gemini-api/docs/document-processing` — PDF/image inline data upload pattern, 50MB / 1000 page limit, base64 encoding approach
- `https://ai.google.dev/gemini-api/docs/structured-output` — `responseSchema` + Zod + `zod-to-json-schema` pattern, `responseMimeType: 'application/json'`
- `https://ai.google.dev/gemini-api/docs/libraries` — `@google/genai` as the recommended GA SDK, install command
- `https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText` — `navigator.clipboard.writeText()` API, secure context requirement
- Existing codebase: `src/app/enter/components/SunPitchTab.tsx` — loading step pattern (setInterval + STATUS_MESSAGES array)
- Existing codebase: `src/lib/scraper/types.ts` — result envelope shape to mirror

### Secondary (MEDIUM confidence)
- `https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions` — 4.5MB Vercel body limit confirmed
- `https://developers.googleblog.com/en/continuing-to-bring-you-our-latest-models-with-an-improved-gemini-2-5-flash-and-flash-lite-release/` — Gemini 2.5 Flash as current recommended model
- WebSearch: Gemini 2.0 Flash retirement date (June 1, 2026) — corroborated by multiple search results

### Tertiary (LOW confidence)
- Gemini 3 Flash Preview existence — seen in search results and a WebFetch but marked "preview"; do not use for production until GA

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@google/genai` verified via official Google docs; Zod + `zod-to-json-schema` pattern verified via official Gemini structured output docs
- Architecture: HIGH — route handler pattern mirrors existing `/api/scrape/route.ts`; loading UX mirrors `SunPitchTab.tsx` exactly; both verified against existing codebase
- Pitfalls: HIGH for Vercel 4.5MB limit (official Vercel KB), route collision (flagged in CONTEXT.md), model retirement (official Google changelog); MEDIUM for clipboard secure context (standard web platform behavior)

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days — Gemini model landscape moves fast; re-check model IDs if planning is delayed)
