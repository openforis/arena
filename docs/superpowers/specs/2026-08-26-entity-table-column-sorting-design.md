# Entity Table Column Sorting — Design Spec

**Date:** 2026-08-26
**Branch:** `feat/entity-table-sorting`

---

## 1. Overview

Node defs of type entity, rendered with **table layout** (as opposed to form layout), currently show child entity instances (rows) in a fixed order: insertion order (`node.id`/`dateCreated`), with new/empty "placeholder" rows always last. There is no way to reorder rows by a column's value.

This spec adds click-to-sort column headers to the entity table, using the existing `SortToggle` component, supporting sorting by multiple columns at once. Sorting is a client-side display concern only — it never mutates record data.

---

## 2. Problem

| Symptom | Cause |
|---------|-------|
| Rows in a table-layout entity are shown in insertion order only | `Record.getNodeChildrenByDefUuid` sorts by `id`/`dateCreated`, with no column-based option |
| No way to find/compare rows by a specific column's value without scrolling | No sort UI exists on entity table column headers |
| A directly analogous feature (multi-column sort via `SortToggle`) already exists in `DataQuery`'s `ColumnHeader`, but is not reused for the entity table | Entity table headers (`NodeDefTableCellHeader`) never wired up sorting |

---

## 3. Decisions

| Topic | Choice |
|-------|--------|
| Sortable columns | Single-value **attribute** columns only (`NodeDef.isAttribute(nodeDef) && !NodeDef.isMultiple(nodeDef)`). Nested-entity columns and multiple-value attribute columns get no toggle. |
| Sort key | The column's **formatted** value (`NodeValueFormatter.format(..., showLabel: true)`), not the raw stored value — e.g. a code attribute sorts by its label, not its code. |
| Multi-column sort | Supported. Every click is **additive** (mirrors `DataQuery/ColumnHeader.js`'s existing behavior) — no modifier key. Clicking a column's toggle cycles only *that* column's state (`none → asc → desc → none`) and leaves other active columns untouched. Priority = position in the sort-criteria array (order criteria were added). |
| Priority indicator | A small badge (1, 2, 3…) next to the arrow, shown only when 2+ columns are actively sorted. New optional `priority` prop on `SortToggle`, unused (backward compatible) by its two existing callers. |
| Placeholder rows | New/empty rows (added via the "+" button) are always pinned at the bottom, regardless of sort — matches today's default (unsorted) behavior. |
| Blank values | Sort last, regardless of ascending/descending direction. |
| State scope & lifetime | Local component state in `NodeDefEntityTableRows`, ephemeral per mounted table instance (resets on navigating away/back or reload). No Redux, no persistence. Matches the existing client-side precedent in `MapLayersPanelContext`. |
| Visibility | Sort toggles render only when `entry` is true (real data-entry/view mode). Never shown during Survey Designer's `edit` (form-design) preview, so there's no interaction with the existing column drag-and-drop (which only runs when `edit && canEditDef`). |
| New files | Written in **TypeScript** (`.ts`, no JSX needed). Edits to existing files stay in their current language (`.js`) — no conversions. |

---

## 4. Architecture

Sorting is entirely client-side and scoped to one rendered entity table instance.

```
NodeDefEntityTableRows                  (owns: sortCriteria state; sorts nodes before mapping to rows)
  └─ NodeDefEntityTableRow (header row) — sortCriteria + onSortBy flow via existing prop chain
       └─ NodeDefEntityTableCell        — already spreads {...props} down, no change needed
            └─ NodeDefSwitch (renderType=tableHeader branch) — forwards sortCriteria/onSortBy
                 └─ NodeDefTableCellHeader — derives its own column's state + priority, renders <SortToggle>
```

Because `NodeDefEntityTableRow` → `NodeDefEntityTableCell` → `NodeDefSwitch` already spread `{...props}` down the chain, adding `sortCriteria`/`onSortBy` to the one explicit prop list in `NodeDefEntityTableRows`'s `createRow()` call is sufficient to make them available at every layer — no need to touch each intermediate file's explicit prop list.

---

## 5. Components / changes

### 5.1 New file (TypeScript): `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort.ts`

Pure logic, no React/JSX, unit-testable in isolation.

```ts
export interface SortCriterion {
  by: string // column node def uuid
  order: 'asc' | 'desc'
}

// none -> asc -> desc -> none, cycling only the entry for `field`; others untouched.
export const getNextSortCriteria = (params: { sortCriteria: SortCriterion[]; field: string }): SortCriterion[]

// Partitions out placeholder rows, sorts the rest by each criterion's column's
// formatted value in turn (first non-zero comparison wins), blanks last,
// then re-appends placeholder rows at the end.
export const sortNodes = (params: {
  nodes: any[] // record nodes (entity instances / rows)
  sortCriteria: SortCriterion[]
  nodeDefColumns: any[] // column node defs, used to resolve `by` uuid -> node def
  survey: any
  cycle: string
  lang: string
  record: any
}): any[]
```

`sortNodes` internals: for each criterion, resolve the column node def from `nodeDefColumns`, then for each row get its child node via `Record.getNodeChildrenByDefUuid(rowNode, columnDefUuid)(record)[0]`, its value via `Node.getValue`, and its formatted string via `NodeValueFormatter.format({ survey, cycle, nodeDef: columnDef, node: childNode, value, showLabel: true, lang })`. Compare with `localeCompare(..., lang, { numeric: true, sensitivity: 'base' })`, negate for `desc`.

### 5.2 `nodeDefEntityTableRows.js` (edit)

- `const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([])` (or plain JS array in this `.js` file).
- `const sortedNodes = useMemo(() => sortCriteria.length ? sortNodes({ nodes, sortCriteria, nodeDefColumns, survey, cycle: surveyCycleKey, lang, record }) : nodes, [nodes, sortCriteria, nodeDefColumns, survey, lang, record])`.
- Use `sortedNodes` (not `nodes`) when mapping data rows.
- `const handleSortBy = useCallback((field) => setSortCriteria((prev) => getNextSortCriteria({ sortCriteria: prev, field })), [])`.
- Pass `sortCriteria` and `onSortBy={entry ? handleSortBy : undefined}` into `createRow()`'s explicit prop list. Gating on `entry` keeps toggles out of design-time preview.
- New `useSelector(RecordState.getRecord)` and `useSurveyPreferredLang()` to obtain `record`/`lang` for the sort call.

### 5.3 `nodeDefSwitch.js` (edit)

In the `renderType === NodeDefLayout.renderType.tableHeader` branch, forward `sortCriteria`/`onSortBy` (already present in `props` via the spread chain) into `NodeDefTableCellHeader`.

### 5.4 `nodeDefTableCellHeader.js` (edit)

Accepts optional `sortCriteria: SortCriterion[]` and `onSortBy: (field: string) => void`. Self-determines sortability: `NodeDef.isAttribute(nodeDef) && !NodeDef.isMultiple(nodeDef) && Boolean(onSortBy)`. When sortable, derives this column's own slice (`index = sortCriteria.findIndex(c => c.by === nodeDefUuid)`, `order = index >= 0 ? sortCriteria[index].order : null`) and priority (`sortCriteria.length > 1 && index >= 0 ? index + 1 : null`), then renders:

```jsx
<SortToggle
  sort={{ by: index >= 0 ? nodeDefUuid : null, order }}
  field={nodeDefUuid}
  priority={priority}
  handleSortBy={onSortBy}
/>
```

inside the existing `label-wrapper` div, next to the label.

### 5.5 `SortToggle.js` (edit)

Add optional `priority?: number` prop (PropTypes: `PropTypes.number`). When set, render a small badge/superscript next to the arrow icon. Default `undefined` → no badge, so `Table`'s and `DataQuery`'s existing usages are unaffected. Small corresponding CSS addition in `SortToggle.scss`.

### 5.6 i18n

None needed — `SortToggle` already uses existing `common.sortAsc` / `common.sortDesc` / `common.sortNone` translation keys.

---

## 6. Data flow for one sort click

Click on column X's `SortToggle` → `handleSortBy(X)` (via `onSortBy` prop) → `NodeDefEntityTableRows.setSortCriteria(getNextSortCriteria({ sortCriteria, field: X }))` → re-render → `sortNodes(...)` recomputes `sortedNodes` → data rows re-map in the new order. No node/record mutation of any kind.

---

## 7. Edge cases

| Case | Behavior |
|------|----------|
| Column with all-blank values | Sorts last as a block, regardless of direction. |
| Third click on the same column | Criterion removed from `sortCriteria`; other active columns' relative priority shifts up automatically (priority = array index). |
| New placeholder row added while a sort is active | Stays pinned at the bottom (partitioned out before sorting, re-appended after). |
| Table has zero data rows | No-op; header still renders (toggles inert, no rows to reorder). |
| Design-time preview (`edit === true`) | No sort toggles rendered (`onSortBy` is `undefined` when `entry` is falsy). |
| Column reordered via drag-and-drop while a sort is active | Unaffected — sort keys by column node def uuid, not display position. |
| Code/taxon/date/coordinate (composite) attribute column | Sortable like any other single-value attribute; compares the full formatted display string (e.g. `"12.34, 56.78"` for coordinate). |

---

## 8. Out of scope

- Sorting by nested-entity columns or multiple-value attribute columns.
- Persisting sort selection across navigation or reloads.
- Shift/Ctrl-click modifier interactions (every click is additive by design in this pass).
- Any change to how table body cells render (still live editable inputs, unaffected by this feature).
- Changes to `DataQuery`'s own sort behavior (only the shared `SortToggle` component gains a new optional, opt-in prop).

---

## 9. Test plan

### Unit (`nodeDefEntityTableRowsSort.ts`)

1. `getNextSortCriteria`: none → asc → desc → none cycle for a single field; adding a second field appends without disturbing the first; removing a middle criterion shifts later ones up in priority.
2. `sortNodes`: ascending/descending by a single text column; multi-column tie-breaking (primary equal, secondary decides); blanks sort last; placeholder rows stay pinned at the end regardless of sort; label-based comparison for a code-like formatted value differs from raw-value comparison.

### Manual

1. Open a record with a table-layout multiple entity; click a text/number column header through all 3 states (asc/desc/none), confirm row order and arrow direction.
2. Click a second column while the first is still active; confirm both toggles show priority badges (1 and 2) and rows are ordered by column 1 then column 2.
3. Add a new row via "+"; confirm it stays pinned at the bottom while a sort is active.
4. Confirm no sort toggle appears on entity/multiple-attribute columns, or on any column while previewing the form in Survey Designer.
5. Confirm `DataQuery`'s column headers and the generic `Table` component's sort UI are visually/behaviorally unchanged.
