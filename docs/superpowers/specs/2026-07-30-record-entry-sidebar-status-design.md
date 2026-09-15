# Record Entry Sidebar Status & Layout — Design Spec

**Date:** 2026-07-30  
**Branch:** `feat/record-entry-ui-improvements`  
**Predecessor:** `docs/superpowers/specs/2026-07-29-record-entry-ui-improvements-design.md`

---

## 1. Overview

Four follow-up improvements to the record-entry sidebar and form content area. All behavioral changes apply to **record entry mode only** (`entry={true}`). Form designer and edit modes keep the current tree layout and styling.

---

## 2. Scope

| # | Fix | Summary |
|---|-----|---------|
| 1 | Inline status icons | Move validation/completion icons into tree row labels; remove separate status strip column; relocate expand/collapse toolbar above tree |
| 2 | Default expansion | Expand all nodes that have visible children on load; keep structural-only nodes collapsed |
| 3 | Collapsed rollup | When a tree item is collapsed, its status icon aggregates descendants; when expanded, only its own page status |
| 4 | Form content card | White entity form panel on grey content background (entry only) |

---

## 3. Decisions (from brainstorming)

| Topic | Choice |
|-------|--------|
| Status icons & rollup scope | Entry mode only |
| Default expansion | Expand every node with ≥1 visible child; placeholder-only nodes stay collapsed |
| Form background | White card on `$greyAppBg`; sidebar stays white |
| Implementation approach | Extend `TreeView` with optional `renderItemSuffix`; new status hook; remove `RecordSidebarStatusStrip` |

---

## 4. Fix 1 — Inline status icons & toolbar

### Problem

`RecordSidebarStatusStrip` renders icons in a fixed 24px column beside the tree. Icons do not scroll naturally with row content and require fragile height alignment. The expand/collapse button sits absolutely inside `.nodedef-tree-select`, overlapping tree content.

### Target layout (entry only)

```
survey-form__sidebar
  ├─ RecordCompletionBar
  ├─ survey-form__sidebar-toolbar          ← NEW
  │    └─ Expand/Collapse all button
  └─ NodeDefTreeSelect (full width)
       └─ each row: [entity icon] [label …] [status icon]
```

### Changes

1. **Remove** `RecordSidebarStatusStrip` from `SurveyForm.js` and delete the component file (or reduce to a shared icon primitive reused by tree suffix).
2. **Extend** `TreeView` / `TreeItemView` with optional prop:
   ```typescript
   renderItemSuffix?: (item: TreeItem, context: { isExpanded: boolean }) => React.ReactNode
   ```
3. **Entry wiring** in `SurveyForm.js`: pass `renderItemSuffix` to `NodeDefTreeSelect` → `TreeView` that renders the status icon after the label.
4. **Toolbar:** move expand/collapse button out of `.nodedef-tree-select` into `survey-form__sidebar-toolbar` above the tree (entry only). Expose `toggleExpanded`, `expanded`, and visibility flag from `useNodeDefTreeSelect` via `NodeDefTreeSelect` props or a render prop.
5. **SCSS:** remove flex row second column for status strip; tree takes full sidebar width. Remove absolute positioning of `.btn-expand` for entry layout.

### Icon placement

- Position: end of tree row label, after truncated label text.
- Size: 16px (same as current strip).
- Tooltips: reuse existing i18n keys (`common.error_plural`, `common.warning_plural`, `surveyForm:pageComplete`).

### Designer / edit

No toolbar, no suffix, expand button stays in current position inside `NodeDefTreeSelect`.

---

## 5. Fix 2 — Default expansion

### Behavior

On initial render and when tree data rebuilds:

- **Expand** every node whose `items` array contains ≥1 real visible child.
- **Do not expand** nodes that only have the hidden `hasSubPages` placeholder (`hasSubPages && !items.length`).
- **Expand/Collapse all** button:
  - Expand: all expandable item keys (same as `collectExpandableItemKeys` today).
  - Collapse: root item key only.

### Sync on tree rebuild

When `treeItems` changes and global expanded mode is `true`, recompute `expandedNodeDefUuids` from expandable keys so newly visible branches open automatically.

### Entry vs designer

Entry mode uses the behavior above. Designer/edit keeps existing `useNodeDefTreeSelect` defaults without entry-specific rebuild sync (or shares hook with a flag `expandAllWithVisibleChildren?: boolean`).

---

## 6. Fix 3 — Collapsed vs expanded status rollup

### Problem

`useRecordPageValidationStatus` always aggregates all nodes belonging to a page entity. When the tree is fully expanded, parent and child pages all show icons, causing visual clutter.

### New hook

`useRecordTreeItemStatus({ pageNodeDefUuid, descendantPageUuids, isTreeItemExpanded })`

| `isTreeItemExpanded` | Status scope |
|----------------------|--------------|
| `false` (collapsed) | Self + all descendant page node defs in subtree |
| `true` (expanded) | This page only |

### Descendant set

Collect page node def UUIDs from the tree item's `items` subtree (recursive). Only include items present in the rendered tree (respects visibility filtering from `useBuildEntityTreeData`).

### Aggregation rules

For rollup (collapsed):

- **hasErrors:** true if any scoped page has errors.
- **hasWarnings:** true if any scoped page has warnings (and no errors in rollup display — errors win).
- **complete:** show green check only if **all** scoped pages are 100% complete and none have errors/warnings.

For single page (expanded):

- Reuse existing `useRecordPageValidationStatus` and `useRecordPageCompletionPercent`.

### Priority (display)

1. Error (red)
2. Warning (orange)
3. Complete (green, 100%)
4. No icon

### TreeView integration

`renderItemSuffix` receives `isExpanded` from MUI tree item expanded state (whether this item's key is in `expandedItems`).

---

## 7. Fix 4 — Form content white card (entry)

### Problem

`.survey-form__internal-container-wrapper` uses `$greyAppBg`, but `.survey-form__node-def-entity-wrapper` has no background, so the form area reads as plain white against a white sidebar with little separation.

### Solution

```scss
.survey-form.entry .survey-form__node-def-entity-wrapper {
  background-color: $white;
  // minimal padding; optional 1px border or subtle radius using theme tokens
}
```

- Sidebar remains white.
- Content wrapper remains `$greyAppBg`.
- Entity form is a white panel on grey — entry mode only.

---

## 8. Architecture & data flow

```
SurveyForm (entry)
  ├─ sidebar-toolbar → NodeDefTreeSelect.toggleExpanded
  └─ NodeDefTreeSelect
       └─ TreeView
            renderItemSuffix(item, { isExpanded })
              └─ useRecordTreeItemStatus(pageUuid, descendants, isExpanded)
                   ├─ expanded  → useRecordPageValidationStatus + useRecordPageCompletionPercent
                   └─ collapsed → rollup across descendant page UUIDs
```

### Files to modify

| File | Change |
|------|--------|
| `webapp/components/TreeView/TreeView.js` | Add `renderItemSuffix`, pass `isExpanded` per item |
| `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.js` | Accept/pass suffix renderer; optional external toolbar mode |
| `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useNodeDefTreeSelect.js` | Entry sync on tree rebuild; export toolbar state |
| `webapp/components/survey/SurveyForm/SurveyForm.js` | Toolbar, wire suffix, remove strip |
| `webapp/components/survey/SurveyForm/SurveyForm.scss` | Toolbar, remove strip column, entry card styles |
| `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts` | **NEW** — rollup logic |
| `webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx` | **DELETE** or extract shared `RecordPageStatusIcon` |
| `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntitySwitch.scss` or `nodeDefEntityForm.scss` | Entry white card (if not only in SurveyForm.scss) |

---

## 9. Error handling

- Hooks return safe defaults when record is null or page entity missing.
- Suffix renderer returns `null` when no status applies.
- No changes to server or validation pipeline.

---

## 10. Testing notes

- Manual verification in entry mode:
  - Icons inline with labels, scroll with tree.
  - No grey status column.
  - Expand/collapse toolbar above tree.
  - All visible-child nodes expanded on load; placeholder-only nodes collapsed.
  - Collapsed parent shows rollup; expanded parent shows own status only.
  - White form card on grey background.
- Designer mode: no regressions to tree or expand button placement.

---

## 11. Out of scope

- Changing validation or completion APIs in arena-core.
- E2e tests for this iteration.
- Converting `SurveyForm.js` or `TreeView.js` to TypeScript (optional follow-up).
