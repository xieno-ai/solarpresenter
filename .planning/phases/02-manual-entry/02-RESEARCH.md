# Phase 2: Manual Entry - Research

**Researched:** 2026-03-02
**Domain:** React client-side form validation, localStorage persistence, Next.js App Router client components
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form Structure**
- Single scrollable page with all fields visible, grouped into labeled sections
- Each data group (Customer, System, Consumption, Rates, Financing) in its own Card component — reuses the existing rounded-xl, border, bg-neutral-900/50 pattern from Phase 1
- Two-column responsive grid layout for section cards — mirrors the smoke test page layout
- No progress indicator or sidebar — validation errors guide the user through required fields

**Monthly Values Input**
- Always show 12 monthly fields for both production and consumption
- An "annual total" field at the top of each group auto-distributes into the 12 monthly fields using the Alberta solar curve when entered
- Monthly fields remain editable after auto-fill — user can tweak individual months
- Annual total field stays in sync: updates to reflect the sum of all 12 months if any individual month is changed
- Compact 4x3 grid layout (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec) for each set of monthly fields
- Production and consumption monthly grids displayed side-by-side in one wide card for easy month-by-month comparison

**Validation Behavior**
- Field-level validation triggers on blur (when user leaves a field)
- Required field errors: red border around the field with a short inline message below (e.g., "Required" or "Must be 1-100 kW")
- Range checks on all numeric inputs (e.g., system size 1-100 kW, monthly kWh 0-5000)
- Cross-field validation warnings (e.g., system size vs total production mismatch): amber non-blocking banner at the top of the relevant section — user CAN still generate the proposal
- Blocking errors (missing required fields, out-of-range values) prevent generation — separate from amber warnings
- Rate fields (all-in rate, buy rate, sell rate, escalation) pre-filled from Alberta config defaults via Supabase — user can override any value

**Generate Action**
- Sticky footer bar always visible at bottom of viewport
- Footer shows validation status (e.g., "3 fields remaining") and the Generate Proposal button
- Generate button disabled until all required fields are valid (blocking errors resolved)
- No confirmation step — clicking Generate goes straight to proposal generation
- For Phase 2 stub: Generate shows the validated ProposalInputs as formatted JSON (proves the form correctly builds the data contract)

**Data Persistence**
- Auto-save form state to localStorage on every change
- If user refreshes or closes tab, form data persists
- Future phases (SunPitch scraping, bill extraction) can write to the same localStorage store to pre-fill the form

### Claude's Discretion
- Specific field ordering within each section card
- Input component styling details (border radius, focus ring color, etc.)
- How the annual-to-monthly distribution animation/transition works
- Exact validation messages and error copy
- localStorage key naming and serialization approach
- Mobile responsive breakpoints and single-column fallback

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INPUT-02 | User can manually enter all proposal fields in a form (system size, 12-month production, 12-month consumption, current rate, system cost, financing terms, customer name/address) | React Hook Form + Zod schema maps 1:1 to ProposalInputs type; useFieldArray handles 12 monthly inputs for each group |
| INPUT-06 | All numeric inputs are validated with range checks and cross-field validation (e.g., system size vs production consistency) | Zod .min()/.max() for range checks; separate React useState for non-blocking cross-field warnings (not in Zod — see Critical Insight below) |
| INPUT-07 | Missing or suspect data is clearly indicated with visual error states before proposal generation | React Hook Form formState.errors drives red border / inline message; blocking error count drives Generate button disabled state |
</phase_requirements>

---

## Summary

Phase 2 builds a validated data-entry form as a Next.js App Router client component (`"use client"`). The form must collect all fields of the `ProposalInputs` TypeScript type (already defined in Phase 1) and persist state to localStorage. The primary technical challenge is the two-tier validation architecture: Zod + React Hook Form handles blocking field-level errors, while a separate React state layer handles non-blocking amber cross-field warnings. These two systems MUST be kept separate because Zod validation always blocks form submission.

The 12-month distribution feature requires a custom two-way sync: writing an annual total auto-fills monthly fields using the Alberta solar curve; editing any monthly field updates the annual total. This sync must avoid infinite loops and must not interfere with React Hook Form's internal state management. The recommended pattern is `watch()` with `useEffect` + `setValue()`, using refs to track whether a change originated from the user or from a programmatic update.

Form data is serialized to localStorage on every change. Since localStorage is unavailable during server-side rendering, all reads must occur inside `useEffect`. The form page is a pure client component — it calls `getAlbertaConfig()` from a server action (or fetches from an API route) to pre-populate rate fields, then hands control entirely to the client.

**Primary recommendation:** Use React Hook Form 7.71.x with `@hookform/resolvers` 5.x and Zod 4.x for blocking validation. Implement cross-field warnings as a separate `useState` layer computed from `watch()`. Store form values as strings in localStorage and convert to Decimal at submission time.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.2 | Form state management, blur validation, error tracking | De-facto standard for React forms; minimal re-renders; native blur mode support |
| zod | ^4.3.6 | Schema definition, field-level range validation, type inference | TypeScript-first; generates inferred types; best performance in ecosystem |
| @hookform/resolvers | ^5.2.2 | Bridges Zod schema into React Hook Form | Official resolver package; auto-detects Zod v3/v4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none — already installed) | — | Tailwind CSS already in project | All styling handled by existing Tailwind config |
| (none — already installed) | — | Decimal.js already in project | Form submission constructs Decimal values from string inputs |

**No new UI component libraries.** Project uses hand-rolled components (existing CLAUDE.md and code context confirm Tailwind-only, no shadcn/ui).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Hook Form | Formik | Formik causes more re-renders; RHF is faster for 24+ field forms |
| Zod 4 | Zod 3 | Zod 4 is 14x faster, 57% smaller; @hookform/resolvers 5.x supports both |
| Zod 4 | Yup | Zod 4 has better TypeScript inference and type exports |

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/
├── enter/                    # New route: /enter (manual entry form)
│   └── page.tsx              # "use client" — the form page
src/components/
├── form/
│   ├── FormInput.tsx         # Reusable input field with error state
│   ├── MonthlyGrid.tsx       # 4x3 grid with annual total + 12 monthly fields
│   ├── SectionCard.tsx       # Card wrapper with amber warning banner slot
│   └── GenerateFooter.tsx    # Sticky footer with validation status + Generate button
src/lib/
├── form/
│   ├── schema.ts             # Zod schema for ProposalInputs (string-based for form)
│   ├── defaults.ts           # Alberta solar curve constants + default form values
│   └── persistence.ts        # localStorage read/write helpers with hydration guard
```

### Pattern 1: Zod Schema with String Fields (Form vs. Domain Types)

**What:** The form works in strings internally (HTML inputs are always strings). Zod schema accepts strings and validates them. At submission, strings are converted to Decimal via `d()`.

**When to use:** Always for numeric inputs. Never store Decimal in form state — React Hook Form and Zod both work with primitives.

**Example:**
```typescript
// src/lib/form/schema.ts
// Source: https://react-hook-form.com/docs/useform (verified)
import { z } from 'zod';

const numericString = (min: number, max: number, label: string) =>
  z.string()
    .min(1, 'Required')
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= min && Number(v) <= max,
      { message: `Must be ${min}–${max}` }
    );

export const proposalFormSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Required'),
    address: z.string().min(1, 'Required'),
  }),
  system: z.object({
    systemSizeKw: numericString(1, 100, 'System size'),
    annualProductionKwh: numericString(1, 150000, 'Annual production'),
    monthlyProductionKwh: z.array(numericString(0, 5000, 'Monthly production')).length(12),
  }),
  consumption: z.object({
    annualConsumptionKwh: numericString(1, 150000, 'Annual consumption'),
    monthlyConsumptionKwh: z.array(numericString(0, 5000, 'Monthly consumption')).length(12),
    annualElectricityCost: numericString(0, 500000, 'Annual electricity cost'),
  }),
  rates: z.object({
    allInRate: numericString(0.01, 2.0, 'All-in rate'),
    netMeteringBuyRate: numericString(0.01, 2.0, 'Buy rate'),
    netMeteringSellRate: numericString(0.01, 2.0, 'Sell rate'),
    annualEscalationRate: numericString(0, 0.30, 'Escalation rate'),
  }),
  financing: z.object({
    cashPurchasePrice: numericString(1000, 500000, 'Cash price'),
    financeMonthlyPayment: numericString(0, 10000, 'Monthly payment'),
    financeTermMonths: numericString(1, 600, 'Term'),
    financeInterestRate: numericString(0, 0.50, 'Interest rate'),
  }),
});

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;
```

### Pattern 2: Two-Tier Validation (Blocking + Non-Blocking)

**What:** Zod handles blocking errors (field-level, range, required). A separate `useState` holds cross-field warnings that are computed from `watch()` results. Warnings never touch Zod schema — they are computed imperatively.

**Why critical:** Zod's `superRefine` ALWAYS blocks submission. Non-blocking amber warnings MUST live outside Zod. This is a verified finding from the @hookform/resolvers issue tracker.

**Example:**
```typescript
// In the form page component ("use client")
// Source: react-hook-form.com/docs/useform (verified)
const { control, watch, setValue, formState: { errors, isValid } } = useForm<ProposalFormValues>({
  resolver: zodResolver(proposalFormSchema),
  mode: 'onBlur',
  defaultValues: getDefaultFormValues(),
});

// Non-blocking warnings — computed separately from Zod
const [warnings, setWarnings] = useState<{ systemProductionMismatch?: string }>({});

const watchedSystem = watch(['system.systemSizeKw', 'system.annualProductionKwh']);

useEffect(() => {
  const [sizeStr, prodStr] = watchedSystem;
  const size = Number(sizeStr);
  const prod = Number(prodStr);
  if (!isNaN(size) && !isNaN(prod) && size > 0) {
    const ratio = prod / size;
    if (ratio < 1000 || ratio > 1800) {
      setWarnings((w) => ({
        ...w,
        systemProductionMismatch: `Production/size ratio ${ratio.toFixed(0)} kWh/kW seems unusual for Alberta (expected 1000–1800)`,
      }));
    } else {
      setWarnings((w) => ({ ...w, systemProductionMismatch: undefined }));
    }
  }
}, [watchedSystem]);
```

### Pattern 3: Annual ↔ Monthly Two-Way Sync

**What:** Annual total → distributes to 12 monthly fields (via Alberta solar curve). Individual monthly edits → recalculates annual total. Must not cause infinite re-render loops.

**Key pattern:** Use a `syncSource` ref (`'annual' | 'monthly' | null`) to distinguish user-initiated changes from programmatic updates. Only trigger distribution when `syncSource` is `'annual'`; only sum up when `syncSource` is `'monthly'`.

**Alberta solar curve (normalized, derived from Paul Friesen reference fixture):**
```typescript
// src/lib/form/defaults.ts
export const ALBERTA_SOLAR_CURVE: readonly number[] = [
  0.045388, // Jan
  0.058206, // Feb
  0.083211, // Mar
  0.103383, // Apr
  0.115991, // May
  0.123555, // Jun
  0.123555, // Jul
  0.108426, // Aug
  0.088254, // Sep
  0.065560, // Oct
  0.046648, // Nov
  0.037823, // Dec
] as const;
// Sum ≈ 1.0 (normalized from Paul Friesen 14,277 kWh annual fixture)
// Source: Paul Friesen test fixture in src/test-data/paul-friesen.ts
```

**Example sync logic:**
```typescript
// Production annual → monthly distribution
const syncSource = useRef<'annual' | 'monthly' | null>(null);

// Watch annual production total field
useEffect(() => {
  const sub = watch((values, { name }) => {
    if (name !== 'system.annualProductionKwh') return;
    if (syncSource.current === 'monthly') return; // monthly edit already triggered sum
    const annual = Number(values.system?.annualProductionKwh ?? '0');
    if (isNaN(annual) || annual <= 0) return;
    syncSource.current = 'annual';
    ALBERTA_SOLAR_CURVE.forEach((fraction, i) => {
      setValue(
        `system.monthlyProductionKwh.${i}`,
        (annual * fraction).toFixed(0),
        { shouldDirty: true, shouldValidate: false } // Don't trigger blur validation
      );
    });
    syncSource.current = null;
  });
  return () => sub.unsubscribe();
}, [watch, setValue]);

// Watch monthly fields → update annual total
useEffect(() => {
  const sub = watch((values, { name }) => {
    if (!name?.startsWith('system.monthlyProductionKwh')) return;
    if (syncSource.current === 'annual') return;
    const months = values.system?.monthlyProductionKwh ?? [];
    const sum = months.reduce((acc: number, v) => acc + (Number(v) || 0), 0);
    syncSource.current = 'monthly';
    setValue('system.annualProductionKwh', sum.toFixed(0), { shouldDirty: true, shouldValidate: false });
    syncSource.current = null;
  });
  return () => sub.unsubscribe();
}, [watch, setValue]);
```

### Pattern 4: localStorage Auto-Save with Hydration Guard

**What:** Read from localStorage inside `useEffect` (after hydration). Write to localStorage on every form change via `watch()`. Never read localStorage during render.

**Why:** Next.js server-renders the form page before the browser loads. `localStorage` does not exist on the server. Accessing it during render causes a hydration mismatch error.

**localStorage key:** `solar-presenter-form-draft` (suggested naming — Claude's discretion)

**Example:**
```typescript
// src/lib/form/persistence.ts
const STORAGE_KEY = 'solar-presenter-form-draft';

export function loadFormDraft(): Partial<ProposalFormValues> | null {
  if (typeof window === 'undefined') return null; // Server guard
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFormDraft(values: ProposalFormValues): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // localStorage quota exceeded — fail silently
  }
}
```

**In the form component:**
```typescript
// Hydration guard: load from localStorage only after mount
const [defaultValues, setDefaultValues] = useState<ProposalFormValues>(getEmptyDefaults());
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  const draft = loadFormDraft();
  if (draft) reset(draft); // react-hook-form reset() with restored values
  setIsHydrated(true);
}, []); // Empty deps: runs once after mount only

// Auto-save on change
useEffect(() => {
  const sub = watch((values) => saveFormDraft(values as ProposalFormValues));
  return () => sub.unsubscribe();
}, [watch]);
```

### Pattern 5: Sticky Footer with Validation Status

**What:** A `position: fixed; bottom: 0` bar showing blocking error count and the Generate button. The main content gets `pb-24` (or similar) to prevent the last form section from being hidden behind the footer.

**Tailwind approach:**
```tsx
{/* Add pb-24 to the main scrollable area */}
<div className="max-w-5xl mx-auto px-6 py-10 pb-28 space-y-10">
  {/* ... form sections ... */}
</div>

{/* Sticky footer — "use client" component */}
<div className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm z-20">
  <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
    <span className="text-sm text-neutral-400">
      {errorCount > 0 ? `${errorCount} field${errorCount !== 1 ? 's' : ''} remaining` : 'Ready to generate'}
    </span>
    <button
      type="submit"
      disabled={!isValid || errorCount > 0}
      className="px-6 py-2.5 rounded-lg bg-amber-400 text-neutral-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
    >
      Generate Proposal
    </button>
  </div>
</div>
```

### Pattern 6: Rate Field Pre-Population from Supabase

**What:** The form page is a client component but needs Alberta config defaults. The recommended pattern for Next.js App Router is to fetch defaults from an API route (or server action) during component mount, not at page render time (since the form page is `"use client"`).

**Two implementation options:**

Option A — API Route (simpler):
```typescript
// src/app/api/alberta-config/route.ts (server-side route handler)
import { getAlbertaConfig } from '@/lib/config/alberta';
import { NextResponse } from 'next/server';
export async function GET() {
  const config = await getAlbertaConfig();
  return NextResponse.json({
    allInRate: config.defaultNetMeteringBuyRate.toString(), // or use a hardcoded default
    netMeteringBuyRate: config.defaultNetMeteringBuyRate.toString(),
    netMeteringSellRate: config.defaultNetMeteringSellRate.toString(),
    annualEscalationRate: config.defaultEscalationRate.toString(),
  });
}
```

Option B — Server Action (Next.js 15 pattern):
```typescript
// src/app/actions/get-defaults.ts
'use server';
import { getAlbertaConfig } from '@/lib/config/alberta';
export async function getDefaultRates() {
  const config = await getAlbertaConfig();
  return {
    allInRate: config.defaultNetMeteringBuyRate.toString(),
    netMeteringBuyRate: config.defaultNetMeteringBuyRate.toString(),
    netMeteringSellRate: config.defaultNetMeteringSellRate.toString(),
    annualEscalationRate: config.defaultEscalationRate.toString(),
  };
}
```

**Recommendation:** Use a Server Action (Option B) — cleaner, no additional API endpoint to maintain, and aligns with Next.js 15/App Router conventions.

### Recommended Form Page Structure
```
src/app/enter/
└── page.tsx          # "use client" — full form page
                      # Fetches Alberta defaults via server action on mount
                      # Manages: useForm, watch subscriptions, warnings state, localStorage
```

The page is intentionally a single large client component. Splitting into smaller components requires lifting form state up or using Context — overkill for a single-route form. The planner may break it into sub-components but the form state lives in one `useForm` instance.

### Anti-Patterns to Avoid
- **Storing Decimal in form state:** React Hook Form works with primitives. Store strings, convert to Decimal only at submit time via `d(value)`.
- **Using `valueAsNumber` with Controller:** Controller does not support `setValueAs` / `valueAsNumber`. Transform values in the `onChange` handler manually.
- **Putting cross-field warnings in Zod's `superRefine`:** superRefine always blocks submission. Non-blocking warnings MUST be separate React state.
- **Reading localStorage in component body:** Always use `useEffect` — never in render path or in `useState` initializer function (initializer runs on server too).
- **Validating monthly grid on every keystroke:** Use `shouldValidate: false` when calling `setValue` during programmatic sync to avoid triggering validation mid-input.
- **Using `append`/`remove` on useFieldArray for fixed 12-length arrays:** Initialize all 12 slots in `defaultValues` and use `update()` or direct `setValue()` — never add or remove slots.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom useState per field | react-hook-form `useForm` | RHF handles dirty state, touched state, error aggregation, re-render optimization |
| Schema validation | Manual if/else validation functions | Zod schema | Zod auto-generates TypeScript types; superRefine for multi-field rules; integrates with RHF resolver |
| Error count aggregation | Custom error counter | `Object.keys(formState.errors).length` or `formState.isValid` | RHF tracks all errors internally; `isValid` is always up to date |
| Field array management | Custom array with add/remove | `useFieldArray` (initialized with all 12) | RHF tracks array field IDs, avoids key collisions on re-render |
| LocalStorage serialization | Custom serializer | `JSON.stringify` / `JSON.parse` | Form values are all strings — JSON round-trips cleanly; no custom serializer needed |

**Key insight:** The form's biggest complexity is the annual ↔ monthly sync. Every other problem has a library solution. Invest the custom code budget in the sync logic, not in reinventing form or validation primitives.

---

## Common Pitfalls

### Pitfall 1: Zod superRefine Blocks Submission
**What goes wrong:** Developer puts cross-field warnings (system size vs production mismatch) inside the Zod schema using `superRefine`. The Generate button stays permanently disabled because Zod counts these as validation failures.
**Why it happens:** Zod has no concept of "warning" — all `ctx.addIssue` calls produce blocking errors.
**How to avoid:** Keep the Zod schema strictly for field-level range/required checks. Implement cross-field warnings in a separate `useState<Record<string, string>>` updated by `watch()` + `useEffect`.
**Warning signs:** Generate button won't enable even when all fields appear valid.

### Pitfall 2: Annual ↔ Monthly Infinite Re-render Loop
**What goes wrong:** `watch()` subscription fires → `setValue()` updates a field → `watch()` subscription fires again → infinite loop.
**Why it happens:** `watch()` fires on every field change, including programmatic `setValue()` calls.
**How to avoid:** Use a `useRef` flag (`syncSource`) to mark whether a change is user-initiated or programmatic. Skip sync logic when flag indicates a programmatic change is in progress.
**Warning signs:** Browser tab freezes or React reports "Maximum update depth exceeded".

### Pitfall 3: localStorage Hydration Mismatch
**What goes wrong:** `localStorage.getItem()` called during render → server renders empty form → client renders pre-filled form → React hydration mismatch error in console (or worse, silent corruption).
**Why it happens:** `localStorage` is a browser API. Next.js server-renders all components, including those with `"use client"`.
**How to avoid:** All localStorage reads MUST be inside `useEffect(() => {...}, [])`. Use `typeof window === 'undefined'` guard in utility functions. Initialize `useState` with empty defaults (matching server render).
**Warning signs:** "Hydration failed" error in console; form fields flicker on page load.

### Pitfall 4: Decimal Precision in Form Values
**What goes wrong:** A rate field stored as `0.168` is displayed as `"0.168000000000001"` due to float formatting.
**Why it happens:** Alberta config Decimal values call `.toString()` which may surface floating point noise from operations.
**How to avoid:** When populating form defaults from Supabase config, use the raw string that Supabase returns (NUMERIC columns come back as strings — pass directly, same as Phase 1 pattern). Or use `.toFixed(N)` from the existing `toFixed()` utility.
**Warning signs:** Rate fields show many trailing decimal places; users see unexpected values.

### Pitfall 5: Sticky Footer Covers Content
**What goes wrong:** The final form section (Financing) is partially hidden behind the sticky Generate footer bar.
**Why it happens:** `position: fixed` elements are removed from document flow; content scrolls under them.
**How to avoid:** Add `pb-24` or `pb-28` to the outer scrollable container. Measure the footer height and match the padding.
**Warning signs:** User can't see or click the last few input fields.

### Pitfall 6: Controller vs register for Monthly Grid
**What goes wrong:** Using `register()` directly on inputs inside the monthly grid conflicts with programmatic `setValue()` calls from the annual sync. The displayed value doesn't update.
**Why it happens:** Uncontrolled inputs (registered via `register()`) show stale DOM values when updated programmatically.
**How to avoid:** Use `Controller` (or `useController`) for all monthly inputs so the displayed value is React-controlled. Programmatic `setValue()` then updates the React state that drives the input's `value` prop.
**Warning signs:** User types annual total → monthly fields don't visually update even though form state has new values.

### Pitfall 7: Monthly 12-Slot Array Not Initialized in defaultValues
**What goes wrong:** `useFieldArray` or array field paths like `system.monthlyProductionKwh.5` are undefined on first render, causing RHF to throw.
**Why it happens:** React Hook Form requires all fields to have default values at registration time.
**How to avoid:** Initialize `defaultValues` with all 12 slots filled: `monthlyProductionKwh: Array(12).fill('0')`.
**Warning signs:** Console errors about uncontrolled → controlled input or undefined field paths.

---

## Code Examples

Verified patterns from official sources and project context:

### Form Page Shell ("use client" with hydration guard)
```typescript
// src/app/enter/page.tsx
'use client';
// Source: https://react-hook-form.com/docs/useform (HIGH confidence, verified)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useRef } from 'react';
import { proposalFormSchema, ProposalFormValues } from '@/lib/form/schema';
import { loadFormDraft, saveFormDraft } from '@/lib/form/persistence';
import { getEmptyDefaults } from '@/lib/form/defaults';

export default function ManualEntryPage() {
  const { control, watch, setValue, reset, handleSubmit, formState } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    mode: 'onBlur',
    defaultValues: getEmptyDefaults(), // empty strings for all fields
  });

  // Hydration guard: restore localStorage draft after mount
  useEffect(() => {
    const draft = loadFormDraft();
    if (draft) reset({ ...getEmptyDefaults(), ...draft });
  }, [reset]);

  // Auto-save on change
  useEffect(() => {
    const sub = watch((values) => saveFormDraft(values as ProposalFormValues));
    return () => sub.unsubscribe();
  }, [watch]);

  // ... rest of form
}
```

### Zod Schema Validation Pattern (from docs)
```typescript
// Source: https://react-hook-form.com/docs/useform (HIGH confidence)
// mode: 'onBlur' — validates when user leaves a field
// reValidateMode defaults to 'onChange' — re-validates as user corrects errors (good UX)
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur',
  // reValidateMode: 'onChange', // default — no need to specify
});
```

### Building ProposalInputs from Form Values at Submit
```typescript
// Source: src/lib/decimal/index.ts (Phase 1 — HIGH confidence)
// Convert form strings → Decimal at submission boundary
import { d } from '@/lib/decimal';
import type { ProposalInputs } from '@/lib/types';

function buildProposalInputs(values: ProposalFormValues): ProposalInputs {
  return {
    customer: {
      name: values.customer.name,
      address: values.customer.address,
      latitude: 0, // Phase 2: latitude/longitude not in manual entry form
      longitude: 0,
    },
    system: {
      systemSizeKw: d(values.system.systemSizeKw),
      annualProductionKwh: d(values.system.annualProductionKwh),
      monthlyProductionKwh: values.system.monthlyProductionKwh.map(d) as MonthlyValues,
    },
    consumption: {
      annualConsumptionKwh: d(values.consumption.annualConsumptionKwh),
      monthlyConsumptionKwh: values.consumption.monthlyConsumptionKwh.map(d) as MonthlyValues,
      annualElectricityCost: d(values.consumption.annualElectricityCost),
    },
    rates: {
      allInRate: d(values.rates.allInRate),
      netMeteringBuyRate: d(values.rates.netMeteringBuyRate),
      netMeteringSellRate: d(values.rates.netMeteringSellRate),
      annualEscalationRate: d(values.rates.annualEscalationRate),
    },
    financing: {
      cashPurchasePrice: d(values.financing.cashPurchasePrice),
      financeMonthlyPayment: d(values.financing.financeMonthlyPayment),
      financeTermMonths: parseInt(values.financing.financeTermMonths, 10),
      financeInterestRate: d(values.financing.financeInterestRate),
    },
  };
}
```

### Reusable Form Input Component (no external library)
```tsx
// src/components/form/FormInput.tsx
// Aligns with existing: DM Sans body, JetBrains Mono data, amber/emerald/sky accents
interface FormInputProps {
  label: string;
  unit?: string; // e.g., "kW", "%", "$/kWh"
  error?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
}

function FormInput({ label, unit, error, value, onChange, onBlur, placeholder }: FormInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-500">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal" // Shows numeric keyboard on mobile
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={[
            'w-full bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-neutral-100',
            'font-[family-name:var(--font-mono)] placeholder:text-neutral-600',
            'focus:outline-none focus:ring-1',
            error
              ? 'border-red-500/60 focus:ring-red-500/40'
              : 'border-neutral-700 focus:ring-amber-400/40',
            unit ? 'pr-12' : '',
          ].join(' ')}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-[family-name:var(--font-mono)]">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
```

---

## Alberta Solar Curve Reference

The auto-distribution curve for production monthly fields uses the Paul Friesen reference fixture (already in the codebase). This is the canonical Alberta solar production profile for this project.

```typescript
// Normalized fractions (sum ≈ 1.0) — source: src/test-data/paul-friesen.ts
// Annual total × fraction = monthly value
export const ALBERTA_SOLAR_CURVE = [
  0.045388, // Jan
  0.058206, // Feb
  0.083211, // Mar
  0.103383, // Apr
  0.115991, // May
  0.123555, // Jun
  0.123555, // Jul
  0.108426, // Aug
  0.088254, // Sep
  0.065560, // Oct
  0.046648, // Nov
  0.037823, // Dec
] as const;
```

**Note:** There is NO equivalent solar curve for consumption. Consumption auto-distribution is not part of the spec — only production uses this curve. Consumption monthly fields start at `0` and the user fills them in individually (or an annual total distributes evenly across 12 months, which is a reasonable default for consumption).

**Cross-field validation ranges for warnings (not blocking):**
- Production / systemSizeKw ratio: warn if outside 1000–1800 kWh/kW (Alberta range ~1100–1700 based on Edmonton calculator data)
- annualProductionKwh vs sum of monthly: warn if delta > 1% (sync should keep these in sync, but manual edits can drift)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zod v3 (^3.x) | Zod v4 (^4.x) | Released 2025 | 14x faster string parsing, 57% smaller bundle; @hookform/resolvers 5.x required |
| Formik | React Hook Form | 2020-2022 | RHF has fewer re-renders; Formik is largely legacy |
| Next.js Server Actions + form POST | Client-side RHF + server action for defaults only | Next.js 13+ | Form stays fully interactive client-side; server actions only used for data fetching |
| Controlled inputs with individual useState | useForm with `mode: 'onBlur'` | 2021+ | Single form state instance; automatic dirty/touched/error tracking |

**Deprecated/outdated:**
- `react-final-form`: No longer maintained; replaced by RHF
- `Formik`: Slower, larger, no longer the ecosystem default
- `window.localStorage` without `typeof window !== 'undefined'` guard: Breaks Next.js SSR

---

## Open Questions

1. **Latitude/Longitude fields for manual entry**
   - What we know: `CustomerInfo` type includes `latitude` and `longitude` for satellite image (Phase 4). These fields are not in the CONTEXT.md decisions for Phase 2.
   - What's unclear: Should the manual entry form collect lat/lon? The Phase 2 scope says "customer name and customer address" only. Lat/lon is for satellite image (SunPitch scraping territory).
   - Recommendation: Stub as `0, 0` in the built `ProposalInputs` for Phase 2. Add lat/lon to the form in Phase 6 if needed. The planner should note this explicitly in the plan.

2. **annualElectricityCost field in ConsumptionInfo**
   - What we know: `ConsumptionInfo` includes `annualElectricityCost: Decimal`. The CONTEXT.md decisions list the form fields as "system size, 12-month production, 12-month consumption, current rate, system cost, financing terms, customer name, and customer address" — no explicit mention of annualElectricityCost.
   - What's unclear: Is `annualElectricityCost` a user input or a computed value (= annualConsumptionKwh × allInRate)?
   - Recommendation: It can be computed: annualConsumptionKwh × allInRate = annualElectricityCost. Show it as a read-only computed display field, not an input. This keeps the form consistent with the data contract without adding a redundant input.

3. **Consumption monthly distribution approach**
   - What we know: Production uses the Alberta solar curve. Consumption has no equivalent curve.
   - What's unclear: When user enters annual consumption total, how should it distribute? Even 1/12 split? Or leave monthly fields at 0 until manually entered?
   - Recommendation: Distribute evenly (1/12 per month) when annual consumption total is entered. This is a reasonable starting point that users can override. The decision is in "Claude's Discretion" for the distribution animation/approach.

---

## Sources

### Primary (HIGH confidence)
- `react-hook-form` official docs at https://react-hook-form.com/docs/useform — verified: mode options, watch/setValue API, Controller behavior
- `react-hook-form` official docs at https://react-hook-form.com/docs/usefieldarray — verified: fixed-length array pattern, update() method
- Zod v4 official docs at https://zod.dev/v4 — verified: Zod 4 is latest stable; breaking changes from v3; import path `zod`
- `src/test-data/paul-friesen.ts` — Alberta solar curve derived directly from this canonical fixture
- `src/lib/types/proposal-inputs.ts` — ProposalInputs type structure, all field names and types

### Secondary (MEDIUM confidence)
- npm registry (via WebSearch) — react-hook-form 7.71.2, @hookform/resolvers 5.2.2, zod 4.3.6 — verified by multiple search results including npm official pages
- https://solarcalculator.ca/report/Alberta/Edmonton/ — Edmonton monthly solar production data (confirms Paul Friesen curve is in the right range for Alberta at ~53°N)
- @hookform/resolvers GitHub issues (via WebSearch, issues #799, #813) — confirms Zod v4 support in resolvers 5.x

### Tertiary (LOW confidence)
- WebSearch results on localStorage + Next.js hydration — patterns are consistent across multiple sources and align with Next.js official docs guidance; treating as MEDIUM
- Alberta cross-field validation ranges (1000–1800 kWh/kW) — derived from Edmonton solar data + Paul Friesen fixture; not from an official Alberta standard

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-hook-form, zod, @hookform/resolvers are the ecosystem standard; versions verified via npm
- Architecture: HIGH — patterns derived from official docs + existing project code; cross-field warning separation is verified from @hookform/resolvers issue tracker
- Alberta solar curve: HIGH — derived directly from Paul Friesen fixture already in codebase (canonical source for this project)
- Pitfalls: HIGH — most pitfalls verified through official docs or known API constraints (Zod superRefine always blocks; Controller omits setValueAs)
- Rate defaults from Supabase: HIGH — getAlbertaConfig() already works (Phase 1 smoke test confirmed)

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (react-hook-form and zod are stable; Next.js 16 App Router patterns are stable)
