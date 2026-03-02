---
phase: 02-manual-entry
plan: 02
subsystem: ui
tags: [react-hook-form, tailwind, typescript, components, controlled-inputs]

# Dependency graph
requires:
  - phase: 02-01
    provides: "ProposalFormValues type, ALBERTA_SOLAR_CURVE, proposalFormSchema — the typed contracts all components build against"
provides:
  - FormInput: labeled text input with unit suffix, error/readOnly states, amber focus ring
  - SectionCard: card wrapper with JetBrains Mono amber header, conditional non-blocking warning banner
  - GenerateFooter: fixed bottom bar with Generate button disabled on errorCount > 0 or !isFormValid
  - MonthlyGrid: 12-field Controller-based grid with two-way annual/monthly sync and loop-safe syncSource ref
affects: [02-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [react-hook-form-controller-pattern, syncSource-ref-loop-prevention, two-way-watch-sync]

key-files:
  created:
    - src/components/form/FormInput.tsx
    - src/components/form/SectionCard.tsx
    - src/components/form/GenerateFooter.tsx
    - src/components/form/MonthlyGrid.tsx

key-decisions:
  - "Controller (not register) used for all 12 monthly inputs — programmatic setValue requires controlled components"
  - "syncSource ref prevents infinite watch loop: annual→monthly and monthly→annual effects check and set ref to block re-entry"
  - "as any cast used for react-hook-form dynamic field paths (annualPath, monthlyBasePath.N) — TypeScript cannot narrow template literal paths to the union type at compile time"
  - "errors prop on MonthlyGrid accepts Record<string, { message?: string }[]> to pass through RHF fieldState arrays from parent"
  - "useAlbertaCurve=false uses uniform 1/12 split for consumption (no Alberta-specific consumption curve exists)"

patterns-established:
  - "Pattern: Controller wraps FormInput for all react-hook-form controlled fields to ensure programmatic setValue updates the displayed value"
  - "Pattern: syncSource useRef guard prevents watch() subscription re-entry when two effects observe related fields"
  - "Pattern: SectionCard as section container — consistent amber monospace header + optional warning banner + padded content area"

requirements-completed: [INPUT-06, INPUT-07]

# Metrics
duration: ~10min
completed: 2026-03-02
---

# Phase 2 Plan 2: Form Components Summary

**Four reusable form components with FormInput (labeled input + error states), SectionCard (card wrapper + warning banner), GenerateFooter (sticky Generate button), and MonthlyGrid (12-field Controller grid with two-way annual/monthly ALBERTA_SOLAR_CURVE sync)**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-02T23:27:55Z
- **Completed:** 2026-03-02T23:38:00Z
- **Tasks:** 2 (both auto)
- **Files created/modified:** 4

## Accomplishments
- FormInput renders a labeled text input with unit suffix (right-aligned), red border on error, amber focus ring on valid, dimmed readOnly state — all controlled via props, no RHF coupling
- SectionCard wraps sections with an amber monospace header label and a conditional amber warning banner (SVG triangle icon) that is purely informational and never blocks inputs
- GenerateFooter displays dynamic "N fields remaining" / "Ready to generate" status text and a disabled Generate button when errorCount > 0 or isFormValid is false
- MonthlyGrid renders 12 Controller-based monthly inputs in a 4x3 grid with an annual total input at top; annual→monthly distributes via ALBERTA_SOLAR_CURVE (production) or even 1/12 split (consumption); monthly→annual sums all 12; syncSource ref prevents infinite re-render loop

## Task Commits

Each task was committed atomically:

1. **Task 1: FormInput, SectionCard, and GenerateFooter** - `dec6620` (feat)
2. **Task 2: MonthlyGrid** - `7a0aacf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/form/FormInput.tsx` - Labeled text input with unit suffix, error/readOnly/valid states, decimal inputMode
- `src/components/form/SectionCard.tsx` - Card wrapper with amber monospace header and conditional SVG warning banner
- `src/components/form/GenerateFooter.tsx` - Fixed bottom bar with status text and disabled-aware Generate button
- `src/components/form/MonthlyGrid.tsx` - 12-field Controller grid with two-way annual/monthly sync using syncSource ref guard

## Decisions Made
- Used `Controller` (not `register`) for all 12 monthly inputs: `register` returns a plain ref, so programmatic `setValue` from the watch subscription does not update the displayed input value. `Controller` renders a React-controlled input where `field.value` is derived from the RHF store, so `setValue` triggers a re-render.
- `syncSource` ref (`useRef<'annual' | 'monthly' | null>(null)`) guards both `watch` effects: when the annual effect fires, it sets `syncSource.current = 'annual'` before calling `setValue` on monthly fields, which would otherwise trigger the monthly effect and create an infinite loop. The monthly effect checks `syncSource.current === 'annual'` and returns early.
- `as any` cast required for dynamic template-literal field paths (`system.monthlyProductionKwh.0`, etc.) — TypeScript cannot narrow these to the RHF `FieldPath<ProposalFormValues>` union at runtime.
- Consumption distribution uses uniform `1/12` fraction (not ALBERTA_SOLAR_CURVE) — the curve models solar irradiance for production, not household consumption patterns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in MonthlyGrid Controller name props and errors indexing**
- **Found during:** Task 2 (MonthlyGrid)
- **Issue:** Dynamic template-literal paths could not be narrowed to `FieldPath<ProposalFormValues>` union; `errors?.[i]?.message` used wrong access pattern for `{ message?: string }[]` type
- **Fix:** Added `as any` cast on Controller `name` props; changed `errors?.[i]?.message` to `errors?.[i]?.[0]?.message` to access first element of the array
- **Files modified:** src/components/form/MonthlyGrid.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 7a0aacf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (TypeScript type narrowing)
**Impact on plan:** Necessary for TypeScript correctness; no behavior change, no scope creep.

## Issues Encountered
None beyond the TypeScript fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 components are TypeScript-clean and ready for import in 02-03 (form page assembly)
- FormInput, SectionCard, GenerateFooter accept plain props — no RHF dependency, maximally composable
- MonthlyGrid accepts `control`, `setValue`, `watch` from parent useForm() — wire directly in form page
- Import paths: `@/components/form/FormInput`, `@/components/form/SectionCard`, etc.

## Self-Check: PASSED

- `src/components/form/FormInput.tsx` — FOUND
- `src/components/form/SectionCard.tsx` — FOUND
- `src/components/form/GenerateFooter.tsx` — FOUND
- `src/components/form/MonthlyGrid.tsx` — FOUND
- Commit `dec6620` — FOUND
- Commit `7a0aacf` — FOUND
- `npx tsc --noEmit` — PASSED (0 errors)

---
*Phase: 02-manual-entry*
*Completed: 2026-03-02*
