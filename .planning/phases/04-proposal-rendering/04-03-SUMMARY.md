---
phase: 04-proposal-rendering
plan: 03
subsystem: proposal-rendering
tags: [react, tsx, static-pages, svg, scroll-snap, nrg-branding]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [complete-11-page-proposal]
  affects: [src/app/proposal/page.tsx]
tech_stack:
  added: []
  patterns: [inline-svg-chart, static-hardcoded-content, proposal-page-shell, nrg-css-variables]
key_files:
  created:
    - src/app/proposal/pages/TableOfContentsPage.tsx
    - src/app/proposal/pages/PriceHistoryPage.tsx
    - src/app/proposal/pages/WhatsComingPage.tsx
    - src/app/proposal/pages/WhyUsPage.tsx
    - src/app/proposal/pages/WarrantyPage.tsx
    - src/app/proposal/pages/FAQPage.tsx
    - src/app/proposal/pages/NextStepsPage.tsx
  modified:
    - src/app/proposal/page.tsx
decisions:
  - "[04-03]: PriceHistoryPage uses pure inline SVG area chart (no charting library) — hardcoded path data avoids Recharts dynamic import complexity for a static page"
  - "[04-03]: FAQPage uses 2-column grid layout instead of vertical accordion — fits proposal-page height constraint without scrolling"
  - "[04-03]: NextStepsPage uses 2-column grid of step cards rather than a vertical timeline — better space utilization in fixed viewport"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-03"
  tasks_completed: 2
  files_created: 7
  files_modified: 1
---

# Phase 4 Plan 3: Static Marketing Pages Summary

**One-liner:** 7 static NRG-branded proposal pages (TOC, Price History, What's Coming, Why Us, Warranty, FAQ, Next Steps) with inline SVG chart completing the full 11-page scroll-snap proposal.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TableOfContentsPage + PriceHistoryPage | 99a433f | TableOfContentsPage.tsx, PriceHistoryPage.tsx, page.tsx |
| 2 | Static pages 7-11 + full 11-page assembly | e3d359c | WhatsComingPage.tsx, WhyUsPage.tsx, WarrantyPage.tsx, FAQPage.tsx, NextStepsPage.tsx, page.tsx |

## What Was Built

### TableOfContentsPage (Page 2)
9-section grid with red circular number badges (`--nrg-red-badge`), section titles in DM Sans Bold, and short descriptions. Two-column layout with white cards and subtle drop shadows. Left green accent strip + Bebas Neue sub-label following the CoverPage pattern.

### PriceHistoryPage (Page 6)
Static inline SVG area chart showing Alberta electricity rate history from 2010–2024 (10.2¢ to 16.8¢/kWh). Uses `<linearGradient>` fill (#ed6b52 to #fb8365 matching PDF red tones), data point dots, Y-axis gridlines, and X-axis year labels. Four stat callout boxes above chart. All computed in module scope — no runtime calculations.

### WhatsComingPage (Page 7)
Two large side-by-side force cards on page background: left card (`--nrg-gold-banner-inner`) for rising demand with lightning bolt SVG icon and gold accent; right card (`#efecf0`) for aging infrastructure/carbon pricing with building SVG icon and purple accent. Bottom green callout bar reinforcing the solar value proposition.

### WhyUsPage (Page 8)
Full-width green banner header with white heading. Four stat boxes in a horizontal row (500+ installs, 25yr warranty, 100% Alberta-based, 10yr workmanship). Two-column body section: left card with 4 feature bullets, right card with customer testimonial in `--nrg-light-green-bg` with green left border and 5-star SVG rating row.

### WarrantyPage (Page 9)
2×2 grid of warranty cards, each with green top border accent, icon in light green circle, large green term number (Montserrat Bold), and descriptive paragraph. Four warranties: Panel (25yr), Inverter (12yr), Workmanship (10yr), Roof Penetration (10yr).

### FAQPage (Page 10)
6 FAQ panels in a 2-column grid. Each panel: white card with green left-border, bold question in DM Sans Bold, paragraph answer in secondary text. Questions cover net metering, cloudy days, installation time, insurance, maintenance, and system sizing.

### NextStepsPage (Page 11)
6-step installation timeline in 2-column grid layout. Each step: green circle with Bebas Neue step number, step title, week badge in `--nrg-light-green-bg`, and description. Green CTA bar at bottom with contact prompt and northernnrg.ca domain.

### page.tsx — Full Assembly
All 11 pages now imported and rendered in sequence:
1. CoverPage (dynamic) 2. TableOfContentsPage 3. NetMeteringPage (dynamic) 4. CarbonCreditsPage (dynamic) 5. AllInCostsPage (dynamic) 6. PriceHistoryPage 7. WhatsComingPage 8. WhyUsPage 9. WarrantyPage 10. FAQPage 11. NextStepsPage

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes (0 errors) after both tasks
- All 7 static pages created with hardcoded NRG content
- page.tsx renders exactly 11 proposal-page sections in the scroll-snap container
- No placeholder `<div className="proposal-page" />` elements remain

## Self-Check: PASSED

All 7 files confirmed present on disk. Both task commits (99a433f, e3d359c) verified in git log.
