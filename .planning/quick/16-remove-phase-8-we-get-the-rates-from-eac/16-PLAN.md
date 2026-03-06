---
phase: quick-16
plan: 16
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/ROADMAP.md
  - .planning/STATE.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "ROADMAP.md no longer contains Phase 8 Alberta Rate Intelligence"
    - "Phase 9 (Sharing & Scenarios) is renumbered to Phase 8"
    - "STATE.md progress counters reflect the reduced total_phases"
    - "Execution order section in ROADMAP.md is updated to match new numbering"
  artifacts:
    - path: ".planning/ROADMAP.md"
      provides: "Cleaned roadmap without Alberta Rate Intelligence phase"
    - path: ".planning/STATE.md"
      provides: "Updated phase count (8 phases total, not 9)"
  key_links:
    - from: "ROADMAP.md phase list"
      to: "Progress table"
      via: "Phase numbering must be consistent throughout file"
---

<objective>
Remove Phase 8 (Alberta Rate Intelligence) from the roadmap and renumber the former Phase 9 (Sharing & Scenarios) to Phase 8. Update all references and counters to reflect the new 8-phase structure.

Purpose: Rates are already sourced from the customer's SunPitch URL during the scraping phase (Phase 6), making built-in Alberta rate tables redundant. Removing this phase keeps the roadmap honest.
Output: Cleaned ROADMAP.md and updated STATE.md with accurate phase counts.
</objective>

<execution_context>
@C:/Users/David/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/David/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove Phase 8 and renumber Phase 9 in ROADMAP.md</name>
  <files>.planning/ROADMAP.md</files>
  <action>
Edit ROADMAP.md to remove Phase 8 (Alberta Rate Intelligence) and renumber Phase 9 (Sharing & Scenarios) to Phase 8. Specifically:

1. In the phase list bullet points at the top of the Phases section, remove the Phase 8 line entirely. Update the Phase 9 bullet to read "Phase 8: Sharing & Scenarios".

2. Remove the entire "### Phase 8: Alberta Rate Intelligence" section (Goal, Depends on, Requirements, Success Criteria, Plans list).

3. Rename "### Phase 9: Sharing & Scenarios" to "### Phase 8: Sharing & Scenarios". Update its "Depends on" line — it currently says "Phase 5", which remains correct, so leave it unchanged. Keep all content within this section intact.

4. In the "## Progress" section:
   - Update the Overview paragraph: change "built in nine phases" to "built in eight phases" and update the phase execution sequence reference at the end from "1 -> 2 -> ... -> 9" to "1 -> 2 -> ... -> 8".
   - Update the "Execution Order" note: change "Phases 6, 7, and 8 all depend on Phase 2" to "Phases 6 and 7 both depend on Phase 2" (Phase 8 no longer exists as a Phase-2 dependent). Update the body of that note accordingly — the new Phase 8 (Sharing) depends on Phase 5, not Phase 2.
   - In the progress table, remove the "8. Alberta Rate Intelligence" row. Rename "9. Sharing & Scenarios" to "8. Sharing & Scenarios".

5. In the "Phase Numbering" section header note, no changes needed (it explains decimal phases, not relevant here).
  </action>
  <verify>
Read .planning/ROADMAP.md and confirm:
- "Alberta Rate Intelligence" does not appear anywhere in the file
- "Phase 8: Sharing & Scenarios" exists as a section header
- The progress table has exactly 8 rows (phases 1-8)
- "nine phases" is not in the Overview paragraph
  </verify>
  <done>ROADMAP.md contains 8 phases, Phase 8 is Sharing & Scenarios, no trace of Alberta Rate Intelligence remains.</done>
</task>

<task type="auto">
  <name>Task 2: Update STATE.md phase counters</name>
  <files>.planning/STATE.md</files>
  <action>
Edit STATE.md to reflect the new 8-phase structure:

1. In the frontmatter, update `total_phases: 7` — wait, this field currently reads `total_phases: 7` but the roadmap previously had 9 phases. The STATE.md total_phases appears to track completed phases differently. Re-read the actual value and update it appropriately: set `total_phases: 8` (total phases in the project, now 8 after removing Phase 8 Alberta Rate Intelligence).

2. In the "## Current Position" section, the current focus line reads "Phase: 7 of 9 (Bill Extraction)". Update "of 9" to "of 8" — it should now read "Phase: 7 of 8 (Bill Extraction)".

3. In the "## Accumulated Context > Decisions" section, find the decision:
   `[Roadmap]: 9-phase build order follows dependency chain: foundation -> manual entry -> calculations -> rendering -> PDF -> scraping -> bill extraction -> rates -> sharing`
   Update it to:
   `[Roadmap]: 8-phase build order follows dependency chain: foundation -> manual entry -> calculations -> rendering -> PDF -> scraping -> bill extraction -> sharing`
   (Remove "-> rates" from the chain.)

4. In the Progress bar line, update `Progress: [████████████████████] 95% (19/~20 plans)` — with Phase 8 removed (it had TBD plans, so 0 plans removed from count), the total plan count does not change materially. Leave the progress bar as-is unless the total plan estimate changes. The ~20 estimate was based on existing completed plans, so leave unchanged.
  </action>
  <verify>
Read .planning/STATE.md and confirm:
- "9-phase" does not appear in the Decisions section
- "of 9" does not appear in the Current Position section
- The decisions line reflects 8-phase build order without "rates"
  </verify>
  <done>STATE.md accurately describes an 8-phase project without references to Alberta Rate Intelligence.</done>
</task>

</tasks>

<verification>
After both tasks complete, perform a final check:
- grep for "Alberta Rate" in both files — should return nothing
- grep for "nine phases" or "of 9" — should return nothing
- ROADMAP.md Phase 8 section header should be "Sharing & Scenarios"
- STATE.md decisions line should reference "8-phase build order"
</verification>

<success_criteria>
- ROADMAP.md: 8-phase structure, Phase 8 = Sharing & Scenarios, no Alberta Rate Intelligence content
- STATE.md: "8-phase build order" in decisions, "7 of 8" in current position
- No orphaned references to the removed phase anywhere in either file
</success_criteria>

<output>
After completion, create `.planning/quick/16-remove-phase-8-we-get-the-rates-from-eac/16-SUMMARY.md` with what was changed.
</output>
