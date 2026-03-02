---
phase: 02-manual-entry
plan: 03
subsystem: ui
tags: [react-hook-form, zod, next.js, localStorage, form-validation]

# Dependency graph
requires:
  - phase: 02-manual-entry/02-01
    provides: Zod schema, Alberta solar curve defaults, localStorage persistence helpers
  - phase: 02-manual-entry/02-02
    provides: FormInput, SectionCard, GenerateFooter, MonthlyGrid components
provides:
  - Complete manual entry form page at /enter route
  - Two-tier validation (Zod errors + amber cross-field warnings)
  - Alberta rate pre-fill from Supabase on mount
  - localStorage draft restore/auto-save
  - Generate stub showing ProposalInputs JSON contract
affects: [03-calculations, 04-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - React Hook Form onBlur mode with zodResolver for field-level validation
    - Controller wrapper pattern for all form inputs (required for programmatic setValue)
    - Derived emptyRequiredFieldCount to floor errorCount before first blur (RHF onBlur initial-state workaround)
    - Multiple watch() subscriptions — each unsubscribes on cleanup via returned { unsubscribe }
    - Cross-field amber warning computed in watch subscription, stored in local state

key-files:
  created:
    - src/app/enter/page.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "emptyRequiredFieldCount derived from watch() scalar values floors errorCount to prevent 'Ready to generate' on blank form in onBlur mode"
  - "GenerateFooter receives errorCount (not just isValid) so it can show specific remaining field count"
  - "annualElectricityCost rendered as readOnly FormInput — computed by watch subscription, setValue sets schema field so Zod validates it"

patterns-established:
  - "RHF onBlur mode workaround: watch scalar required fields and count empties as floor for errorCount"
  - "Cross-field warnings live in local state, set/cleared in watch subscription filtered by field name"
  - "Multiple watch subscriptions are fine — each subscription unsubscribes independently in useEffect cleanup"

requirements-completed: [INPUT-02, INPUT-06, INPUT-07]

# Metrics
duration: 45min
completed: 2026-03-02
---

# Phase 2 Plan 03: Manual Entry Form Assembly Summary

**Complete /enter form page wiring 5 section cards, Alberta rate pre-fill, two-way monthly grid sync, amber cross-field warnings, and localStorage persistence — human-verified with all 12 acceptance checks passing**

## Performance

- **Duration:** ~45 min (including human verification round-trip)
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2 (form assembly + human verification)
- **Files modified:** 2

## Accomplishments
- Single `useForm` instance wiring all Plan 01/02 outputs into a functional /enter page
- Alberta rate pre-fill from Supabase on mount; silent fallback if Supabase offline
- LocalStorage draft restore on mount + auto-save on every change via watch subscription
- Alberta solar curve distribution (annual total → 12 monthly fields) and even consumption split
- Two-way monthly sync: editing any monthly field updates the annual total without infinite loops
- Cross-field amber warning when system size / production ratio falls outside 1000–1800 kWh/kW
- annualElectricityCost computed read-only from annualConsumptionKwh x allInRate
- Generate stub shows complete ProposalInputs JSON with Decimal values serialized as strings
- Bug fix: empty form correctly shows "14 fields remaining" instead of "Ready to generate"

## Task Commits

Each task was committed atomically:

1. **Task 1: Assemble the /enter form page** - `2fb4a02` (feat)
2. **Bug fix: empty form footer state** - `1ed46bd` (fix)

## Files Created/Modified
- `src/app/enter/page.tsx` - Complete manual entry page with all 5 section cards, effects, and generate stub
- `src/app/page.tsx` - Added "Manual Entry" navigation link to /enter

## Decisions Made

- **emptyRequiredFieldCount workaround:** RHF's `onBlur` mode initializes `isValid` as `true` and `errors` as `{}` on a blank form — it only runs validation after the first blur per field. To fix "Ready to generate" showing on an empty form, we watch all 14 scalar required fields and count those with empty string values. `Math.max(rhfErrorCount, emptyRequiredFieldCount)` is passed to `GenerateFooter` so it shows "14 fields remaining" on mount, decreasing to zero only when all fields are filled and validated.

- **Decimal serialization in JSON stub:** Used replacer function checking `'s' in val && 'e' in val && 'c' in val` to detect Decimal.js instances and call `.toString()` for JSON display. Avoids importing Decimal type for `instanceof` check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed "Ready to generate" on empty form in onBlur mode**
- **Found during:** Task 2 (human verification checkpoint)
- **Issue:** RHF `onBlur` mode does not validate on mount. `isValid` starts as `true` and `errors` stays `{}` for an empty form until each field is individually blurred. `GenerateFooter` thus showed "Ready to generate" text and enabled the button immediately.
- **Fix:** Added `emptyRequiredFieldCount` computed from `watch()` values for all 14 required scalar fields. Used `Math.max(rhfErrorCount, emptyRequiredFieldCount)` as the `errorCount` passed to footer. After each field is filled and blurred, RHF errors take over and the count converges correctly.
- **Files modified:** `src/app/enter/page.tsx`
- **Verification:** TypeScript compiles clean; logic confirmed correct by user in verification round
- **Committed in:** `1ed46bd`

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was essential for correct UX — a disabled generate button that appears enabled is a critical form usability bug. No scope creep.

## Issues Encountered

None beyond the RHF onBlur initial-state bug documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 is complete: all three plans delivered (form lib, form components, form page)
- ProposalInputs data contract is proven end-to-end through the Generate stub
- Phase 3 (Calculations) can consume the validated `ProposalInputs` object from `onSubmit`
- No blockers — ready for Phase 3 planning

---
*Phase: 02-manual-entry*
*Completed: 2026-03-02*
