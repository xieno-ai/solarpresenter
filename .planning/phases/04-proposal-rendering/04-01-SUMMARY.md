---
phase: 04-proposal-rendering
plan: "01"
subsystem: proposal-infrastructure
tags: [url-encoding, css-theme, fonts, server-component, navigation]
dependency_graph:
  requires: []
  provides:
    - encodeProposalParams / decodeProposalParams (URL encoding contract)
    - NRG CSS custom properties scoped to .proposal-root
    - Bebas Neue (--font-display) and Montserrat (--font-montserrat) fonts
    - /proposal route (async server component with scroll-snap container)
    - /enter Generate button navigates to /proposal?d={encoded}
  affects:
    - src/app/enter/page.tsx (onSubmit handler replaced)
    - src/app/layout.tsx (fonts extended)
tech_stack:
  added:
    - Bebas_Neue (next/font/google)
    - Montserrat (next/font/google)
  patterns:
    - URL encoding via btoa(encodeURIComponent(JSON.stringify(values))) for Unicode safety
    - CSS variables scoped to .proposal-root class (not :root) to prevent /enter theme bleed
    - Async server component calling calculateProposal() directly (no server action boundary)
    - GOOGLE_MAPS_API_KEY used server-side only — URL string passed as prop, key never in client bundle
key_files:
  created:
    - src/lib/proposal/url-params.ts
    - src/app/proposal/proposal.css
    - src/app/proposal/page.tsx
  modified:
    - src/app/layout.tsx
    - src/app/enter/page.tsx
decisions:
  - "CSS variables scoped to .proposal-root (not :root) — prevents NRG light theme from bleeding into /enter dark theme"
  - "URL param key is `d` — single base64 blob containing full form values JSON"
  - "buildSatelliteImageUrl returns null if GOOGLE_MAPS_API_KEY absent — no hard dependency on Maps API"
  - "proposal page calls calculateProposal() directly (server component) — not runCalculation (server action)"
  - "void serialized / void satelliteUrl suppress unused-variable warnings until plans 02/03 consume them"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-03"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 4 Plan 1: Proposal Infrastructure Summary

**One-liner:** Scroll-snap /proposal route with NRG light-theme CSS, Bebas Neue/Montserrat fonts, base64 URL encoding, and server-side calculation — wired from /enter Generate button.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | URL encoding utility + NRG CSS theme + fonts | e5eb4a3 | url-params.ts, proposal.css, layout.tsx |
| 2 | Proposal server component + /enter navigation wiring | b2cc708 | proposal/page.tsx, enter/page.tsx |

## Decisions Made

1. **CSS scoping to .proposal-root** — NRG light-theme variables are scoped to `.proposal-root` class rather than `:root`, preventing any color bleed into the `/enter` dark theme which remains untouched.

2. **URL param key `d`** — Single base64 blob (`btoa(encodeURIComponent(JSON.stringify(values)))`) handles all Unicode in customer names/addresses. Round-trip is lossless.

3. **Server component calls engine directly** — `proposal/page.tsx` is an async server component that calls `calculateProposal()` directly rather than the `runCalculation` server action. No action boundary needed.

4. **Satellite image URL stays server-side** — `GOOGLE_MAPS_API_KEY` is consumed in `buildSatelliteImageUrl()` within the server component. Only the resulting URL string is available to JSX — the key is never in the client bundle or network requests.

5. **Placeholder rendering** — Plans 02 and 03 will fill in the actual 11 page sections. For now, a single `proposal-page` div shows the customer name to confirm the route works end-to-end.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/lib/proposal/url-params.ts
- FOUND: src/app/proposal/proposal.css
- FOUND: src/app/layout.tsx
- FOUND: src/app/proposal/page.tsx
- FOUND: src/app/enter/page.tsx
- FOUND: commit e5eb4a3
- FOUND: commit b2cc708
- FOUND: encodeProposalParams/decodeProposalParams exports
- FOUND: --nrg-green scoped to .proposal-root
- FOUND: --font-display (Bebas Neue) and --font-montserrat (Montserrat) in layout
- FOUND: calculateProposal direct call in proposal page
- FOUND: router.push navigation in /enter
