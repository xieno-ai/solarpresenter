---
phase: quick-5
plan: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/enter/components/SunPitchTab.tsx
autonomous: true
requirements: [INPUT-01]

must_haves:
  truths:
    - "The SunPitch import tab renders a visually complete, prominent UI — not just a bare text input"
    - "A user opening /enter immediately sees the SunPitch import as the primary workflow (active by default)"
    - "The import panel communicates what it does, what to paste, and what happens after import"
    - "Loading state shows a meaningful progress indication for the 10-60 second wait"
    - "Error states are clearly differentiated from the loading/idle states"
  artifacts:
    - path: src/app/enter/components/SunPitchTab.tsx
      provides: "Polished SunPitch import panel with instruction section, URL input, import button, progress indicator, and error display"
  key_links:
    - from: src/app/enter/components/SunPitchTab.tsx
      to: /api/scrape
      via: fetch POST { url }
      pattern: "fetch.*api/scrape"
---

<objective>
Enhance the SunPitch import tab UI in `SunPitchTab.tsx` so it feels like a complete, polished workflow — not a bare input field. The current component has the correct logic but minimal visual treatment. A user landing on the page should immediately understand this is the primary import path and feel confident using it.

Purpose: The enter page defaults to the SunPitch tab, so it is the first thing every user sees. A bare URL input without context leaves users confused about what to paste and what will happen. A rich import panel builds trust and clarity.

Output: An enhanced `SunPitchTab.tsx` with an instruction header, a styled URL input card, a prominent import button, a rich progress state (step list with animated indicator), and a clear error panel.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Current SunPitchTab.tsx API — executor must preserve these exactly -->

Props interface (must not change):
```typescript
interface SunPitchTabProps {
  onImportSuccess: (result: ScrapeResult) => void;
}
```

ScrapeResult (from src/lib/scraper/types.ts):
```typescript
type ScrapeStatus = 'success' | 'partial' | 'error';
interface ScrapeResult {
  status: ScrapeStatus;
  data?: Partial<ProposalFormValues>;
  missingFields: string[];
  message?: string;
}
```

STATUS_MESSAGES array (must be preserved — drives cycling during load):
```typescript
const STATUS_MESSAGES = [
  'Opening SunPitch proposal...',
  'Extracting customer information...',
  'Reading system specifications...',
  'Extracting monthly production data...',
  'Extracting consumption data...',
  'Reading financing terms...',
  'Finalizing import...',
];
```

Core logic (must be preserved unchanged):
- `validateSunPitchUrl(url)` called before fetch — returns null (valid) or error string
- `fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }) })`
- `result.status === 'error'` → show scrapeError, do NOT call onImportSuccess
- Otherwise → call `onImportSuccess(result)`

State (must be preserved):
- `url`, `isLoading`, `urlError`, `scrapeError`, `statusIndex`
- `intervalRef` for cycling status messages every 2500ms
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redesign SunPitchTab with a polished import panel UI</name>
  <files>src/app/enter/components/SunPitchTab.tsx</files>
  <action>
Rewrite the JSX in SunPitchTab.tsx while preserving ALL existing logic (state, effects, handlers, imports). Only the returned JSX changes.

Design target: a structured import panel that communicates purpose, guides input, and gives rich feedback during the long scrape wait (10-60s).

Layout structure:

1. **Header section** — an eyebrow + headline + sub-copy block:
   - Eyebrow: small monospace label "AUTOMATED IMPORT" with an amber dot accent
   - Headline: "Import from SunPitch" in 1.5rem bold, text-neutral-100
   - Sub-copy: "Paste your SunPitch proposal link below. The system will extract customer info, system specs, monthly production, and pricing automatically." in text-neutral-500 text-sm

2. **URL input card** — a `div` with `bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4`:
   - Label: "Proposal URL" in text-xs font-medium text-neutral-400 uppercase tracking-wider
   - Input: same styling as current but larger (py-3 px-4), full width, monospace font for the URL value (`font-[family-name:var(--font-mono)]`), placeholder text kept as-is
   - Inline URL error below input (preserved, red text-xs)
   - Helper text below: "Format: https://app.sunpitch.com/facing/proposals/{uuid}" in text-xs text-neutral-600 font-mono

3. **Import button** — preserve existing amber button styling but make it slightly larger (py-3 px-6) and full-width on mobile, auto width on desktop. Keep the download SVG icon and "Import Data" text.

4. **Progress panel** (shown only when `isLoading === true`, replaces button area during load):
   Replace the loading button with a dedicated progress card: `bg-neutral-900 border border-neutral-800 rounded-xl p-5`
   - Top row: animated spinner SVG (amber) + current status message (text-sm text-neutral-300)
   - Below: a vertical list of the 7 STATUS_MESSAGES, each shown as a step. Steps before statusIndex = completed (amber check icon, text-neutral-500 line-through). Current step (statusIndex) = amber text, pulsing dot. Future steps = text-neutral-700.
   - Below steps: a note in text-xs text-neutral-600: "SunPitch proposals typically take 10–60 seconds to process."

   Show BOTH the button (disabled) AND the progress panel when loading — button stays visible but disabled/dimmed so user can see it; progress panel appears above it or just replace the button entirely. Cleaner: hide the button during loading, show the progress panel, then restore button on completion.

5. **Error panel** (preserved, same amber warning design):
   Keep existing structure. Optionally add a "Try again" reset action (just clears scrapeError state — sets `setScrapeError(null)`) as a small text link: "Try a different URL" that calls `setScrapeError(null)`.

Color/font constraints:
- Dark neutral theme (bg-neutral-950 base, neutral-900 cards) — matches the rest of /enter
- Amber (#f5a623 / amber-400) as the single accent color
- Use `var(--font-mono)` for URL input and helper text
- No green or blue accents in this component
- All SVG icons inline (no emoji)

The component must remain 'use client' and all existing import statements preserved.
  </action>
  <verify>
    <automated>cd "D:/Cursor/Solar Presenter" && npx tsc --noEmit 2>&1 && echo "TypeScript clean"</automated>
  </verify>
  <done>
    - TypeScript compiles clean (no errors)
    - SunPitchTab.tsx renders an instruction header, styled URL input card, and amber import button
    - Loading state shows a step-list progress panel with the 7 STATUS_MESSAGES and cycling current step
    - Error state shows the amber warning panel with a "Try a different URL" reset link
    - All existing logic (validateSunPitchUrl, fetch, onImportSuccess, state vars) is preserved unchanged
  </done>
</task>

</tasks>

<verification>
After execution:
1. `npx tsc --noEmit` passes with zero errors
2. Visit http://localhost:3001/enter — SunPitch tab is active by default and shows the redesigned import panel (header + URL card + button)
3. Click Import without a URL — inline error appears below the input
4. Paste a malformed URL and click Import — client-side validation error appears, no network request
5. During a real import attempt — progress panel replaces the button, showing cycling steps
</verification>

<success_criteria>
The /enter page SunPitch tab feels like a purposeful, polished import workflow — not a bare form field. A user can immediately understand: what to paste, what will happen, and how long to wait. The enhanced UI adds no new behavior, only visual clarity to the existing logic.
</success_criteria>

<output>
After completion, create `.planning/quick/5-add-sunpitch-import-tab-and-ui-on-the-en/5-SUMMARY.md` documenting what was changed, the design decisions made, and the final state of SunPitchTab.tsx.
</output>
