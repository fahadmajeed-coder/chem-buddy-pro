
# Code audit & improvement plan

After reading the codebase (~18.7k lines across calculators, libs, hooks, and the edge function), here is what I found and what I propose.

## 1. Duplication to remove

**Two periodic tables / two formula parsers**
- `src/lib/periodicTableData.ts` → `parseFormula`, `calcMolarMass`, full element table.
- `src/lib/chemistryEngine.ts` → its own `elements` map (only 60 entries, slightly different masses), its own `parseFormula`, its own `calculateMolarMass`.
- Result: two sources of truth, inconsistent atomic masses, and chemistry results that disagree depending on which screen you're on.
- **Fix**: keep `periodicTableData.ts` (118 elements, complete), delete the duplicate block from `chemistryEngine.ts`, and re-export from there for back-compat. Update every importer.

**Hardcoded admin password in 4 places**
- `src/hooks/useAdminMode.ts`, `src/components/calculators/DataSyncManager.tsx` (×2), `src/components/calculators/SectionCloudSync.tsx` (×3), `supabase/functions/sync-data/index.ts`.
- **Fix**: centralize. Client compares against one constant in `useAdminMode`; cloud writes use the user's already-validated admin session (a single auth header) rather than sending the password in every request body.

**Buffer / pH systems list also exists in CalculationSuite**
- The new pH/Buffer Lab repeats a `BUFFER_SYSTEMS` array that overlaps the indicators inventory. Extract to `src/lib/bufferSystems.ts` and import where needed.

**Inline `localStorage` reads (55 occurrences across 14 files)**
- A `useLocalStorage` hook already exists but ~half the calculators still call `localStorage.getItem/setItem` directly.
- **Fix**: migrate the remaining sections to `useLocalStorage` so the "isWriting ref" sync logic is uniform and SSR-safe.

**Per-section cloud-sync logic duplicated**
- `DataSyncManager.tsx` (652 lines) and `SectionCloudSync.tsx` (235 lines) share the same upload/delete/merge code. Extract to one `lib/cloudSync.ts` module; both UIs call it.

## 2. Security hardening

1. **Server-side admin password check is plaintext compare to a hardcoded string.** Move `ADMIN_PASSWORD` to a Supabase secret (`ADMIN_PASSWORD_HASH`) and compare a SHA-256 hash. Remove the literal from the repo so the published bundle no longer leaks it.
2. **RLS on `default_app_data`**: today anyone with the anon key can read everything. That's the intent for "global defaults", but writes go through the edge function with a body-supplied password. Replace the body password with a short-lived signed token issued after admin login, and rate-limit the function.
3. **`dangerouslySetInnerHTML` / unsanitized formula input**: the custom-formula evaluator builds a `Function(...)` from user strings. Add an allow-list parser (whitelist Math.*, basic ops, declared variables) so a malicious shared formula can't run arbitrary code.
4. **Zod validation** on every form that writes to localStorage or Cloud (inventory, standards, SOP, formulas, reports). Caps length and rejects malformed JSON when importing data transfer bundles.
5. **CORS** on the edge function is `*` — tighten to the project's preview + published origins.
6. **Service-worker precache** was bumped to 10 MB; the real fix is **code-splitting**: lazy-load each calculator section via `React.lazy` so the initial bundle drops below 1 MB and PWA installs faster.

## 3. Architecture polish

- **Lazy-load sections** in `src/pages/Index.tsx` (`React.lazy` + `Suspense`). Cuts first paint, fixes the 2.54 MB bundle warning at the source.
- **Split `CalculationSuite.tsx` (1,883 lines)** into one file per sub-tool under `src/components/calculators/suite/`. Same for `WinFeedSuite` and `ReportSection`.
- **Shared math kernel** at `src/lib/chem/` with: `parser.ts`, `elements.ts`, `solutions.ts` (M/N/F/%/ppm), `buffers.ts`, `dilution.ts`, `stats.ts` (mean, SD, CV%, linear regression). Every calculator becomes a thin UI on top.
- **Unified `useCalculator` hook** that handles lock state, reset, copy-result, and history — currently re-implemented per card.
- **Error boundary** around each section so one broken calculator doesn't blank the whole app.
- **Typed unit system** (`Quantity<Unit>`) to stop string-based unit mixups (mL vs L, g vs mg).

## 4. New professional features

Ranked by value-to-effort for a working chemist:

1. **Global command palette (⌘K / Ctrl-K)** — jump to any section, compound, SOP, or recent calculation; fuzzy search.
2. **Calculation history & favourites** — every result auto-logged with timestamp; pin frequent ones; one-click re-run.
3. **PDF / CSV export everywhere** — currently only COA and CV%. Add to Solution Prep, Dilution, Buffer Designer, Feed Formulation, Calibration.
4. **Batch mode** — paste a CSV of samples, get a results table (huge for QC labs).
5. **Significant figures + uncertainty propagation** — display results with proper sig-figs and ± error based on input precision.
6. **Unit converter overlay** on every numeric input (click the unit chip → convert in place).
7. **Inventory stock tracking** — current quantity, expiry, reorder alerts, lot numbers, COA attachments.
8. **Multi-user profiles (local)** — analyst name on every report, signature line for COA.
9. **Dark/light auto theme** following system + per-section density toggle (comfortable / compact).
10. **Keyboard shortcuts cheat-sheet** (?) and full a11y pass (focus rings, ARIA labels, 44 px touch targets).
11. **Offline-first sync queue** — edits made offline replay to Cloud when back online (today Cloud writes silently fail).
12. **i18n scaffold** (English + one more language) — many Lovable Cloud users are non-English-first.

## 5. Order of work (if approved)

```
Phase A — Cleanup (no UX change)
  A1  Merge periodic tables / parsers into one module
  A2  Centralize admin auth, remove plaintext password from bundle
  A3  Extract cloud-sync + buffer-systems modules
  A4  Migrate remaining localStorage callers to useLocalStorage
  A5  Lazy-load sections, split mega-files

Phase B — Security
  B1  Hashed admin secret + signed token for edge function
  B2  Zod on all write paths + safe formula evaluator
  B3  Tighten CORS, add rate-limit

Phase C — Pro features (pick any subset)
  C1  Command palette + calculation history
  C2  Universal PDF/CSV export
  C3  Sig-figs / uncertainty
  C4  Inventory stock + expiry
  C5  Batch CSV mode
```

No visual redesign is required for Phase A/B; Phase C items each get a small, focused UI in the existing glass-panel style.

Tell me which phases (or which specific items in Phase C) you want me to build, or say "do everything" and I'll execute A → B → C top-to-bottom.
