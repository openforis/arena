# Record Entry UI Improvements — Design Spec

**Date:** 2026-07-29  
**Branch:** to be created from `master`  
**Reference:** https://trello.com/c/R7kHYgHr  
**Predecessor:** `docs/superpowers/specs/2026-07-24-survey-landing-and-theme-design.md`

---

## 1. Overview

Five focused UI improvements to the record-entry experience (`/app/data/record/`). All changes follow the conventions established in the previous UI update: TypeScript-first new files, MUI components and theme tokens over raw SCSS, in-place enhancement (Approach A — no structural refactoring).

---

## 2. Scope

| # | Task | Files primarily affected |
|---|------|--------------------------|
| 1 | Status icon strip — right edge of sidebar | new `RecordSidebarStatusStrip.tsx`, `SurveyForm.js`, `SurveyForm.scss` |
| 2 | Completion progress bar — above sidebar tree | new `RecordCompletionBar.tsx`, new `useRecordCompletionPercent.ts`, `SurveyForm.js` |
| 3 | Always-visible expand arrow in tree | `TreeView.js` → `TreeView.tsx`, `TreeView.scss` |
| 4 | Grey background for record content area | `SurveyForm.scss` |
| 5 | MUI Breadcrumbs with condensed menu | `Breadcrumbs.js` → `Breadcrumbs.tsx`, `Breadcrumbs.scss` |

---

## 3. Design Tokens & Styling Conventions

- New components are `.tsx` files; no new `.scss` files unless strictly necessary.
- Colours come from `webapp/theme/tokens.ts` (`defaultTokens`) or MUI `useTheme()` / `sx` props.
- The SCSS token `$greyAppBg` (`#f6f7f9`) is the canonical light-grey surface.
- MUI icons come from `@mui/icons-material` (already a dependency).
- No `any` types; no inline `console.log`.

---

## 4. Task 3 — Always-visible expand arrow

**Problem:** `MuiTreeItem` only renders its expand-icon slot when children exist in the React tree at render time. In `NodeDefTreeSelect` with `onlyPages=true`, some items have children (sub-pages) but they are loaded lazily, so the arrow is invisible until the user clicks.

**Fix:** In `TreeItemView` (inside `TreeView.js`), when `item.items` is a non-empty array, always render those children. The current code already maps `items` into child `TreeItemView` nodes — so the arrow already appears for items with pre-loaded children. The real fix is to ensure `useBuildEntityTreeData` (in `NodeDefTreeSelect`) always includes child items in the tree data for page-type node defs that have sub-pages, even before they are "active". This is purely a data-layer change in `useBuildEntityTreeData.js`.

Concretely: `useBuildEntityTreeData.js` builds the `items` array passed to `TreeView`. The fix is to ensure that for every page-entity node def, its direct child page-entity node defs are always included as `items` in the tree node — regardless of whether they are the currently active page. The current code already does this for expanded items; the bug is that it stops at the first level that has no active descendant. The fix: recurse unconditionally through all page-entity children when `onlyPages=true`, instead of stopping at the active path.

**Files:** `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useBuildEntityTreeData.js`

---

## 5. Task 4 — Record content background

**Problem:** The form content area shares the same white background as the sidebar, making the boundary invisible.

**Fix:** Add a single rule to `SurveyForm.scss`:

```scss
.survey-form__internal-container-wrapper {
  background-color: $greyAppBg;
}
```

The sidebar (`.survey-form__sidebar`) keeps its default white background. The visual separation is subtle (`#f6f7f9`) but sufficient to distinguish the two panels.

**Files:** `webapp/components/survey/SurveyForm/SurveyForm.scss`

---

## 6. Task 5 — MUI Breadcrumbs

**Problem:** The current `Breadcrumbs` component is a plain JS file using manual `<Link>` + separator `<span>` markup. It does not condense for long paths and is visually cluttered.

**Fix:** Convert `Breadcrumbs.js` to `Breadcrumbs.tsx`. Replace the `<div className="breadcrumbs">` container with MUI `<Breadcrumbs>`:

```tsx
<Breadcrumbs maxItems={3} itemsBeforeCollapse={1} itemsAfterCollapse={1}>
  {/* non-last items */}
  <MuiLink component={Link} to={uri} color="inherit" underline="hover">
    {label}
  </MuiLink>
  {/* last item */}
  <Typography color="text.primary">{label}</Typography>
</Breadcrumbs>
```

- `maxItems` is **not hardcoded**. Instead, `itemsBeforeCollapse={1}` and `itemsAfterCollapse={1}` are fixed (always show root and current), and `maxItems` is derived dynamically: the component measures the available container width and the rendered label widths, then computes the maximum number of items that fit. On first render all items are shown; if overflow is detected, `maxItems` is reduced until the breadcrumb fits. This is implemented with a `ResizeObserver` on the container ref.
- The MUI `Link` wraps React Router's `Link` via the `component` prop (standard MUI pattern).
- The `aria-disabled` behaviour when `surveyIsDirty` is preserved by conditionally rendering a `<Typography>` instead of `<MuiLink>` for non-last items.
- `Breadcrumbs.scss` is deleted if no overrides remain after the conversion; otherwise it retains only height/alignment rules that cannot be expressed in `sx`.

**Files:** `webapp/views/App/Header/Breadcrumbs/Breadcrumbs.tsx` (replaces `.js`), `Breadcrumbs.scss` (trimmed or deleted)

---

## 7. Task 2 — Completion progress bar

**Architecture:**

```
SurveyForm (entry mode, showPageNavigation=true)
  └─ survey-form__sidebar
       ├─ RecordCompletionBar   ← NEW
       └─ NodeDefTreeSelect
```

### `useRecordCompletionPercent.ts`

A hook in `webapp/store/ui/record/hooks/`. It reads the current record from `RecordState` and calls the arena-core completion API (to be provided by Stefano's `@openforis/arena-core` update). The hook signature:

```ts
/** Returns completion percentage [0–100] or null if unavailable. */
const useRecordCompletionPercent = (): number | null
```

If arena-core does not yet export the completion function, the hook returns `null` and the bar is hidden. This makes the feature forward-compatible with the upstream library update.

### `RecordCompletionBar.tsx`

```
webapp/components/survey/SurveyForm/components/RecordCompletionBar.tsx
```

- Renders MUI `LinearProgress` (`variant="determinate"`, `value={percent}`).
- Renders a `Typography` label below: `"X% complete"` (i18n key: `surveyForm:completion`).
- Hidden (`return null`) when `percent === null`.
- Styled via `sx` prop using theme tokens — no new SCSS.
- Shown only when `entry={true}` — the parent `SurveyForm` passes this via a prop guard.

**i18n:** New key `surveyForm.completion` added to `core/i18n/resources/en/surveyForm.js` (and other locales at minimum as a placeholder).

**Migration note:** `SurveyForm.js` is not converted to TypeScript as part of this spec — it is large and the conversion is out of scope. Changes to it remain as `.js` patches only.

**Files:** new `RecordCompletionBar.tsx`, new `useRecordCompletionPercent.ts`, `SurveyForm.js` (JS patch), `core/i18n/resources/en/surveyForm.js`

---

## 8. Task 1 — Sidebar status icon strip

**Architecture:**

```
survey-form__sidebar  (display: flex, flex-direction: column)
  ├─ RecordCompletionBar
  └─ sidebar-tree-row  (display: flex, flex-direction: row, flex: 1, overflow: hidden)
       ├─ NodeDefTreeSelect  (flex: 1, overflow-y: auto)
       └─ RecordSidebarStatusStrip  (width: 24px, display: flex, flex-direction: column)
```

### Status computation

Each visible page-level node def's status is derived from the record's validation object (already in Redux state via `RecordState`). For each page node def UUID:

1. **Has errors** → `RecordState.getValidation` → check if any child node of that page has a `ValidationResult` with severity `error`.
2. **Has warnings** → same check with severity `warning`.
3. **Is complete** → `useRecordCompletionPercent` logic per-page (depends on arena-core; falls back to "no icon" if unavailable).

Combined icon logic:
- Errors present → `ErrorIcon` (red, `defaultTokens.colors.red`)
- No errors, warnings present → `WarningIcon` (orange/yellow, `defaultTokens.colors.orange`)
- No errors, no warnings, complete → `CheckCircleIcon` (green, `defaultTokens.colors.green`)
- No errors, no warnings, not complete or unknown → no icon (empty slot, preserving alignment)

### `RecordSidebarStatusStrip.tsx`

```
webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx
```

- Accepts `pageNodeDefs: NodeDef[]` (the same list rendered by `NodeDefTreeSelect`).
- For each page node def, renders a 24×24px slot with the appropriate MUI icon or nothing.
- Icons use MUI `Tooltip` showing `"Errors"` / `"Warnings"` / `"Complete"` (i18n keys).
- The strip sits in a flex row alongside `NodeDefTreeSelect`. Because MUI `TreeItem` rows have a fixed height, each icon slot is sized to the same height (32px, matching MUI tree item default) so icons align with their corresponding tree rows. The strip does **not** scroll independently — it is `overflow: hidden` and relies on consistent row heights. If tree items ever become variable height, a scroll-listener approach will be needed; that is out of scope here.
- Shown only in `entry={true}` mode.

**Files:** new `RecordSidebarStatusStrip.tsx`, `SurveyForm.js`, `SurveyForm.scss`

---

## 9. Data Flow Summary

```
Redux store (RecordState.getValidation)
  └─ useRecordPageValidationStatus(pageNodeDefUuid) → { hasErrors, hasWarnings }

@openforis/arena-core (completion API — forward-compat)
  └─ useRecordCompletionPercent() → number | null
  └─ useRecordPageCompletionStatus(pageNodeDefUuid) → boolean | null

RecordCompletionBar  ← useRecordCompletionPercent()
RecordSidebarStatusStrip  ← useRecordPageValidationStatus() + useRecordPageCompletionStatus()
```

New hooks:
- `useRecordCompletionPercent.ts` — overall percent
- `useRecordPageValidationStatus.ts` — per-page error/warning from existing validation state
- `useRecordPageCompletionStatus.ts` — per-page completion (arena-core, forward-compat)

---

## 10. Error Handling

- All new hooks return `null` / `false` as safe defaults when data is unavailable; components render nothing rather than crash.
- No `any` types; prop types expressed as TypeScript interfaces.
- No direct `console.log`; server-side logging uses `log4js` (not applicable here — all client code).

---

## 11. Testing Notes

- No new e2e tests required for this iteration (visual changes only).
- Unit tests: `useRecordPageValidationStatus` can be unit-tested once arena-core completion API is available.
- Manual smoke test checklist:
  - [ ] Expand arrow visible for items with sub-pages before clicking
  - [ ] Progress bar appears in entry mode, hidden in edit/preview
  - [ ] Status icons update when fields are filled or errors cleared
  - [ ] Breadcrumbs condense when path > 3 levels, expand on `…` click
  - [ ] Grey background visible in record content area
  - [ ] No regressions in Designer (edit mode) — status strip and bar must not appear

---

## 12. Out of Scope

- Exposing completion percentage in the records list table.
- Per-field completion tracking UI.
- Mobile / responsive layout adjustments.
- Animation or transitions on the progress bar beyond MUI defaults.
