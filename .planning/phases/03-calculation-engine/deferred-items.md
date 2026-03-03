# Deferred Items — Phase 03 Calculation Engine

## Pre-existing Issues (Out of Scope)

### decimal.test.ts — No test suite found

- **File:** `src/lib/decimal/decimal.test.ts`
- **Issue:** Vitest reports "No test suite found in file" — the file exists but contains no `describe` or `test` blocks
- **Discovered during:** 03-02 RED phase
- **Impact:** Low — causes 1 failed test file in `npm test` output but does not affect any engine calculations
- **Action needed:** Add at least one test or delete the file (empty test files cause Vitest to error)
- **Not fixed because:** Pre-existing condition, unrelated to 03-02 scope (calculateProposal assembly)
