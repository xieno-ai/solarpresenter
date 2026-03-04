---
quick_task: 6
description: fix vitest and coverage-v8 peer dependency mismatch blocking Vercel deploy
date: 2026-03-04
---

# Quick Task 6: Fix vitest peer dependency mismatch

## Problem

Vercel deploy fails with `ERESOLVE` because:
- `vitest` pinned at `^3.2.4`
- `@vitest/coverage-v8` at `^4.0.18` requires `vitest@4.0.18` as peer

## Fix

Bump `vitest` to `^4.0.18` in `package.json` to match `@vitest/coverage-v8`.

## Task

- [x] Update `vitest` version in `package.json` from `^3.2.4` → `^4.0.18`
- [x] Run `npm install` to regenerate `package-lock.json`
- [x] Verify tests still pass
