# Entity Table Column Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users click a table-layout entity's column headers to sort its rows (child entity instances), supporting multiple simultaneous sort columns, reusing the existing `SortToggle` component.

**Architecture:** Sorting is a pure, client-side, ephemeral reorder of the `nodes` array already computed for a table-layout entity. All new sort state and logic lives in `NodeDefEntityTableRows` (the component that already owns `nodes`/`nodeDefColumns`); it flows down to `SortToggle` through the same prop chain that already threads other props to `NodeDefTableCellHeader`, with no changes to intermediate components' explicit prop lists. No record/node data is ever mutated.

**Tech Stack:** React 18, Redux (react-redux `useSelector`), Ramda-free plain JS/TS, Jest (via the project's webpack-bundled unit-test harness).

**Spec:** `docs/superpowers/specs/2026-08-26-entity-table-column-sorting-design.md`

## Global Constraints

- New files are written in TypeScript (`.ts`, no JSX needed for this feature). Edits to existing files stay in their current language (`.js`) — no conversions.
- New `.ts` modules follow the existing TS-file convention already used in this codebase (e.g. `webapp/views/App/views/Data/MapView/MapLayersPanel/MapLayersPanelContext.tsx`): rely on TypeScript types/interfaces instead of JSDoc blocks. Do not add JSDoc comments to the new module — this matches actual practice, not just written policy.
- Sortable columns are single-value attribute columns only: `NodeDef.isAttribute(nodeDef) && !NodeDef.isMultiple(nodeDef)`. Nested-entity columns and multiple-value attribute columns never get a sort toggle.
- Sort key is the column's **formatted** value (`NodeValueFormatter.format(..., showLabel: true)`), not the raw stored value.
- Every click on a column's `SortToggle` is additive (cycles only that column's own state: none → asc → desc → none) and leaves other active columns untouched — this exactly mirrors the existing multi-column sort behavior in `webapp/components/DataQuery/Visualizer/DataQueryTable/Row/Column/ColumnHeader.js`.
- Priority (1st, 2nd, …) is shown next to the arrow only when 2+ columns are actively sorted.
- Placeholder (new, not-yet-filled) rows always stay pinned at the bottom, regardless of active sort. Blank cell values always sort last within the non-placeholder rows, regardless of direction.
- Sort state is local component state in `NodeDefEntityTableRows`, ephemeral per mounted table instance. No Redux, no persistence.
- Sort toggles render only when `entry` is true (real data-entry/view mode) — never during Survey Designer's `edit` (form-design) preview.
- No new i18n keys — `SortToggle` already uses `common.sortAsc` / `common.sortDesc` / `common.sortNone`.
- Path aliases: `@core/*` → `core/`, `@webapp/*` → `webapp/`. Use them in all new/edited imports.
- Lint every touched/created file with `npx eslint --cache --fix <path>` before committing (matches this repo's pre-commit lint-staged behavior).

---

### Task 1: Pure sort logic module (`nodeDefEntityTableRowsSort.ts`)

**Files:**
- Create: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort.ts`
- Test: `test/unit/tests/nodeDefEntityTableRowsSort.test.ts`

**Interfaces:**
- Consumes: `@core/survey/nodeDef` (`NodeDef.getUuid`, `NodeDef.isAttribute`, `NodeDef.isMultiple` — the latter two are used later, in Task 2), `@core/record/node` (`Node.getValue`, `Node.isPlaceholder`), `@core/record/record` (`Record.getNodeChildByDefUuid`), `@core/record/nodeValueFormatter` (`NodeValueFormatter.format`).
- Produces (consumed by Task 2):
  - `export interface SortCriterion { by: string; order: 'asc' | 'desc' }`
  - `export const getNextSortCriteria = ({ sortCriteria, field }: { sortCriteria: SortCriterion[]; field: string }): SortCriterion[]`
  - `export const sortNodes = ({ nodes, sortCriteria, nodeDefColumns, survey, cycle, lang, record }: { nodes: any[]; sortCriteria: SortCriterion[]; nodeDefColumns: any[]; survey: any; cycle: string; lang: string; record: any }): any[]`

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/nodeDefEntityTableRowsSort.test.ts`:

```ts
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Survey from '@core/survey/survey'

import {
  getNextSortCriteria,
  sortNodes,
  SortCriterion,
} from '@webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as DataTest from '../../utils/dataTest'

import { getContextUser } from '../../integration/config/context'

let survey: any = {}
let record: any = {}

const getNode = (path: string) => RecordUtils.findNodeByPath(path)(survey, record)
const getNodeDef = (path: string) => SurveyUtils.getNodeDefByPath({ survey, path })

describe('nodeDefEntityTableRowsSort', () => {
  beforeAll(async () => {
    const user = getContextUser()
    survey = await DataTest.createTestSurvey({ user })
    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  describe('getNextSortCriteria', () => {
    test('adds a new field as ascending when not already sorted', () => {
      const result = getNextSortCriteria({ sortCriteria: [], field: 'a' })
      expect(result).toEqual([{ by: 'a', order: 'asc' }])
    })

    test('cycles an active ascending field to descending', () => {
      const result = getNextSortCriteria({ sortCriteria: [{ by: 'a', order: 'asc' }], field: 'a' })
      expect(result).toEqual([{ by: 'a', order: 'desc' }])
    })

    test('removes an active descending field', () => {
      const result = getNextSortCriteria({ sortCriteria: [{ by: 'a', order: 'desc' }], field: 'a' })
      expect(result).toEqual([])
    })

    test('adds a second field without disturbing the first (additive)', () => {
      const result = getNextSortCriteria({ sortCriteria: [{ by: 'a', order: 'asc' }], field: 'b' })
      expect(result).toEqual([
        { by: 'a', order: 'asc' },
        { by: 'b', order: 'asc' },
      ])
    })

    test('removing a middle criterion shifts later criteria up in priority', () => {
      const sortCriteria: SortCriterion[] = [
        { by: 'a', order: 'desc' },
        { by: 'b', order: 'asc' },
        { by: 'c', order: 'asc' },
      ]
      const result = getNextSortCriteria({ sortCriteria, field: 'a' })
      expect(result).toEqual([
        { by: 'b', order: 'asc' },
        { by: 'c', order: 'asc' },
      ])
    })
  })

  describe('sortNodes', () => {
    const treeIdOf = (node: any) => {
      const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
      return Node.getValue(Record.getNodeChildByDefUuid(node, treeIdDef.uuid)(record))
    }

    test('sorts by a single numeric column, ascending, keeping stable order on ties', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [{ by: treeHeightDef.uuid, order: 'asc' }],
        nodeDefColumns: [treeHeightDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      // heights: tree1=13 tree2=10 tree3=11 tree4=10 tree5=33
      // tree2/tree4 tie on height=10; original order (tree2 before tree4) is preserved
      expect(sorted.map(treeIdOf)).toEqual([2, 4, 3, 1, 5])
    })

    test('sorts by a single numeric column, descending', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [{ by: treeHeightDef.uuid, order: 'desc' }],
        nodeDefColumns: [treeHeightDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      expect(sorted.map(treeIdOf)).toEqual([5, 1, 3, 2, 4])
    })

    test('breaks ties on the primary column using a second sort column', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const dbhDef = getNodeDef('cluster/plot/tree/dbh')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [
          { by: treeHeightDef.uuid, order: 'asc' },
          { by: dbhDef.uuid, order: 'asc' },
        ],
        nodeDefColumns: [treeHeightDef, dbhDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      // dbh breaks the height=10 tie between tree2 (dbh 15) and tree4 (dbh 7)
      expect(sorted.map(treeIdOf)).toEqual([4, 2, 3, 1, 5])
    })

    test('sorts blank values last regardless of direction', () => {
      const plot1 = getNode('cluster/plot[0]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const speciesDef = getNodeDef('cluster/plot/tree/tree_species')
      const nodes = Record.getNodeChildrenByDefUuid(plot1, treeDef.uuid)(record)

      const sortedAsc = sortNodes({
        nodes,
        sortCriteria: [{ by: speciesDef.uuid, order: 'asc' }],
        nodeDefColumns: [speciesDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })
      const sortedDesc = sortNodes({
        nodes,
        sortCriteria: [{ by: speciesDef.uuid, order: 'desc' }],
        nodeDefColumns: [speciesDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      // tree1 has a species set, tree2 does not -> tree2 sorts last both ways
      expect(sortedAsc.map(treeIdOf)).toEqual([1, 2])
      expect(sortedDesc.map(treeIdOf)).toEqual([1, 2])
    })

    test('keeps placeholder rows pinned at the bottom regardless of sort', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const realNodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)
      const placeholder = Node.newNodePlaceholder(treeDef, plot3)
      const nodes = [...realNodes, placeholder]

      const sorted = sortNodes({
        nodes,
        sortCriteria: [{ by: treeHeightDef.uuid, order: 'desc' }],
        nodeDefColumns: [treeHeightDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      expect(sorted[sorted.length - 1]).toBe(placeholder)
      expect(sorted.length).toBe(nodes.length)
    })

    test('returns the nodes array unchanged when no sort criteria are active', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [],
        nodeDefColumns: [],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      expect(sorted).toBe(nodes)
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "nodeDefEntityTableRowsSort"`
Expected: FAIL — webpack build fails (or the test fails at import time) because `nodeDefEntityTableRowsSort.ts` doesn't exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort.ts`:

```ts
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as CoreRecord from '@core/record/record'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

export interface SortCriterion {
  by: string // column node def uuid
  order: 'asc' | 'desc'
}

// none -> asc -> desc -> none, cycling only the entry for `field`; other criteria are left untouched
// and keep their existing array position (their sort priority).
export const getNextSortCriteria = ({
  sortCriteria,
  field,
}: {
  sortCriteria: SortCriterion[]
  field: string
}): SortCriterion[] => {
  const index = sortCriteria.findIndex((criterion) => criterion.by === field)

  if (index < 0) {
    return [...sortCriteria, { by: field, order: 'asc' }]
  }

  const criterion = sortCriteria[index]
  if (criterion.order === 'asc') {
    const updated = [...sortCriteria]
    updated[index] = { by: field, order: 'desc' }
    return updated
  }

  return sortCriteria.filter((_criterion, criterionIndex) => criterionIndex !== index)
}

const getFormattedColumnValue = ({
  row,
  columnDef,
  survey,
  cycle,
  lang,
  record,
}: {
  row: any
  columnDef: any
  survey: any
  cycle: string
  lang: string
  record: any
}): string => {
  const childNode = CoreRecord.getNodeChildByDefUuid(row, NodeDef.getUuid(columnDef))(record)
  if (!childNode) return ''

  const value = Node.getValue(childNode, null)
  if (value === null || value === undefined || value === '') return ''

  const formatted = NodeValueFormatter.format({
    survey,
    cycle,
    nodeDef: columnDef,
    node: childNode,
    value,
    showLabel: true,
    lang,
  })
  return formatted ?? ''
}

const compareByCriterion =
  ({
    criterion,
    columnDefByUuid,
    survey,
    cycle,
    lang,
    record,
  }: {
    criterion: SortCriterion
    columnDefByUuid: Record<string, any>
    survey: any
    cycle: string
    lang: string
    record: any
  }) =>
  (rowA: any, rowB: any): number => {
    const columnDef = columnDefByUuid[criterion.by]
    const valueA = getFormattedColumnValue({ row: rowA, columnDef, survey, cycle, lang, record })
    const valueB = getFormattedColumnValue({ row: rowB, columnDef, survey, cycle, lang, record })

    // blanks always sort last, regardless of direction
    if (!valueA && !valueB) return 0
    if (!valueA) return 1
    if (!valueB) return -1

    const comparison = valueA.localeCompare(valueB, lang, { numeric: true, sensitivity: 'base' })
    return criterion.order === 'desc' ? -comparison : comparison
  }

// Partitions out placeholder rows, sorts the rest by each criterion's column's formatted value
// in turn (first non-zero comparison wins), then re-appends placeholder rows at the end.
export const sortNodes = ({
  nodes,
  sortCriteria,
  nodeDefColumns,
  survey,
  cycle,
  lang,
  record,
}: {
  nodes: any[]
  sortCriteria: SortCriterion[]
  nodeDefColumns: any[]
  survey: any
  cycle: string
  lang: string
  record: any
}): any[] => {
  if (sortCriteria.length === 0) return nodes

  const columnDefByUuid = nodeDefColumns.reduce((acc: Record<string, any>, columnDef) => {
    acc[NodeDef.getUuid(columnDef)] = columnDef
    return acc
  }, {})

  const dataRows = nodes.filter((row) => !Node.isPlaceholder(row))
  const placeholderRows = nodes.filter(Node.isPlaceholder)

  const comparators = sortCriteria.map((criterion) =>
    compareByCriterion({ criterion, columnDefByUuid, survey, cycle, lang, record })
  )

  const sortedDataRows = [...dataRows].sort((rowA, rowB) => {
    for (const comparator of comparators) {
      const result = comparator(rowA, rowB)
      if (result !== 0) return result
    }
    return 0
  })

  return [...sortedDataRows, ...placeholderRows]
}
```

Note the `CoreRecord` import alias: `Record` is TypeScript's built-in `Record<K, V>` utility type, used below in `columnDefByUuid: Record<string, any>` — importing the `@core/record/record` module as `Record` would shadow that global type.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "nodeDefEntityTableRowsSort"`
Expected: PASS — all `getNextSortCriteria` and `sortNodes` tests green.

- [ ] **Step 5: Lint and typecheck**

Run:
```bash
npx eslint --cache --fix webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort.ts test/unit/tests/nodeDefEntityTableRowsSort.test.ts
yarn typecheck
```
Expected: both commands exit with no errors.

- [ ] **Step 6: Commit**

```bash
git add webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort.ts test/unit/tests/nodeDefEntityTableRowsSort.test.ts
git commit -m "feat: add pure sort logic for table-layout entity rows"
```

---

### Task 2: Wire sorting into the entity table UI

**Files:**
- Modify: `webapp/components/Table/Header/SortToggle/SortToggle.js`
- Modify: `webapp/components/Table/Header/SortToggle/SortToggle.scss`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.js`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch.js`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`

**Interfaces:**
- Consumes (from Task 1): `SortCriterion`, `getNextSortCriteria`, `sortNodes` from `./nodeDefEntityTableRowsSort` (relative import from within `nodeDefEntityTableRows.js`, which lives in the same directory as the Task 1 module).
- Produces: no new module exports — this task closes the loop entirely inside the existing component tree. `SortToggle` gains one new optional prop (`priority?: number`), backward-compatible with its two existing callers (`webapp/components/Table/Content/ContentHeader.js` and `DataQuery`'s `ColumnHeader.js`), which don't pass it and are therefore unaffected.

- [ ] **Step 1: Add an optional priority badge to `SortToggle`**

Edit `webapp/components/Table/Header/SortToggle/SortToggle.js` — replace the whole file:

```jsx
import './SortToggle.scss'

import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const tooltipKeyByOrder = {
  asc: 'common.sortDesc',
  desc: 'common.sortNone',
}

const SortToggle = ({ disabled = false, sort, field, handleSortBy, priority = null }) => {
  const i18n = useI18n()

  const active = sort.by === field
  const tooltipKey = (active && tooltipKeyByOrder[sort.order]) || 'common.sortAsc'
  const tooltip = i18n.t(tooltipKey)

  return (
    <button
      type="button"
      className={`
        btn-xs btn-transparent btn-sort-toggle
        ${sort.order || ''}
        ${active ? '' : 'inactive'}
      `}
      disabled={disabled}
      onClick={() => handleSortBy(field)}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={active}
    >
      <span className="icon icon-play3 icon-10px arrow-toggle" />
      {priority && <span className="btn-sort-toggle-priority">{priority}</span>}
    </button>
  )
}

SortToggle.propTypes = {
  disabled: PropTypes.bool,
  sort: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  handleSortBy: PropTypes.func.isRequired,
  priority: PropTypes.number,
}

export default SortToggle
```

Edit `webapp/components/Table/Header/SortToggle/SortToggle.scss` — replace the whole file (moves the rotation from the whole button to just the arrow icon, so an added priority badge doesn't rotate with it):

```scss
.btn-sort-toggle {
  color: white;
  position: relative;

  .arrow-toggle {
    display: inline-block;
  }

  &.asc .arrow-toggle {
    transform: rotate(270deg);
  }

  &.desc .arrow-toggle {
    transform: rotate(90deg);
  }

  &.inactive .arrow-toggle {
    transform: rotate(0deg);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-sort-toggle-priority {
    position: absolute;
    top: -4px;
    right: -4px;
    font-size: 0.6rem;
    line-height: 1;
    font-weight: 600;
  }
}
```

- [ ] **Step 2: Render the toggle in the entity table's header cell**

Edit `webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.js` — replace the whole file:

```jsx
import './nodeDefTableCellHeader.scss'

import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { valuePropsTaxon } from '@core/survey/nodeValueProps'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefIconKey from './NodeDefIconKey'
import { NodeDefInfoIcon } from './NodeDefInfoIcon'

const NodeDefTableCellHeader = (props) => {
  const { label, lang, nodeDef, onSortBy, sortCriteria = [] } = props

  const i18n = useI18n()

  const visibleFields = NodeDef.getVisibleFields(nodeDef)
  const fields = NodeDefUiProps.getFormFields(nodeDef).filter(
    (field) => !visibleFields || visibleFields.includes(field.field)
  )

  const getFieldLabelKey = ({ field }) => {
    let labelKey = null
    // use custom field label
    if (NodeDef.isTaxon(nodeDef) && field.field === valuePropsTaxon.vernacularName) {
      labelKey = NodeDef.getVernacularNameLabel(lang)(nodeDef)
    }
    return labelKey || field.labelKey
  }

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const sortable = Boolean(onSortBy) && NodeDef.isAttribute(nodeDef) && !NodeDef.isMultiple(nodeDef)
  const sortCriterionIndex = sortCriteria.findIndex((criterion) => criterion.by === nodeDefUuid)
  const sortToggleSort = {
    by: sortCriterionIndex >= 0 ? nodeDefUuid : null,
    order: sortCriterionIndex >= 0 ? sortCriteria[sortCriterionIndex].order : null,
  }
  const sortPriority = sortCriteria.length > 1 && sortCriterionIndex >= 0 ? sortCriterionIndex + 1 : null

  return (
    <div
      className={`survey-form__node-def-table-cell-header survey-form__node-def-table-cell-${NodeDef.getType(nodeDef)}`}
    >
      <div className="label-wrapper">
        {sortable && (
          <SortToggle sort={sortToggleSort} field={nodeDefUuid} priority={sortPriority} handleSortBy={onSortBy} />
        )}
        <LabelWithTooltip label={label} style={{ gridColumn: `1 / span ${fields.length}` }}>
          <NodeDefIconKey nodeDef={nodeDef} />
        </LabelWithTooltip>
        <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
      </div>

      {fields.length > 1 && (
        <div className="subfields-labels-wrapper">
          {fields.map((field) => (
            <div
              key={field.field}
              className={`label ${field.field}`}
              style={{ flex: NodeDefUiProps.getTableColumnFlex(field.field)(nodeDef) }}
            >
              {i18n.t(getFieldLabelKey({ field }))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

NodeDefTableCellHeader.propTypes = {
  label: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  onSortBy: PropTypes.func,
  sortCriteria: PropTypes.array,
}

export default NodeDefTableCellHeader
```

- [ ] **Step 3: Forward sort props through `NodeDefSwitch`**

Edit `webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch.js`.

In the top prop destructure (currently at line 212), change:

```js
const NodeDefSwitch = (props) => {
  const {
    canEditDef,
    canEditRecord,
    edit,
    empty,
    entry,
    nodeDef,
    parentNode,
    readOnly: readOnlyProp,
    renderType,
  } = props
```

to:

```js
const NodeDefSwitch = (props) => {
  const {
    canEditDef,
    canEditRecord,
    edit,
    empty,
    entry,
    nodeDef,
    onSortBy,
    parentNode,
    readOnly: readOnlyProp,
    renderType,
    sortCriteria = [],
  } = props
```

In the render branch (currently at line 358), change:

```jsx
      {renderType === NodeDefLayout.renderType.tableHeader ? (
        <NodeDefTableCellHeader nodeDef={nodeDef} label={label} lang={lang} />
      ) : renderType === NodeDefLayout.renderType.tableBody ? (
```

to:

```jsx
      {renderType === NodeDefLayout.renderType.tableHeader ? (
        <NodeDefTableCellHeader
          nodeDef={nodeDef}
          label={label}
          lang={lang}
          sortCriteria={sortCriteria}
          onSortBy={onSortBy}
        />
      ) : renderType === NodeDefLayout.renderType.tableBody ? (
```

In `NodeDefSwitch.propTypes` (currently at line 369), add two entries:

```js
NodeDefSwitch.propTypes = {
  canEditDef: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  empty: PropTypes.bool,
  entry: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  onSortBy: PropTypes.func,
  parentNode: PropTypes.object,
  preview: PropTypes.bool,
  readOnly: PropTypes.bool,
  renderType: PropTypes.string,
  sortCriteria: PropTypes.array,
}
```

- [ ] **Step 4: Own the sort state and sort the rows in `NodeDefEntityTableRows`**

Edit `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js`.

Replace the import block at the top of the file:

```js
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'
import { debounce } from '@core/functionsDefer'

import { elementOffset } from '@webapp/utils/domUtils'
import { SurveyState } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'
```

with:

```js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'
import { debounce } from '@core/functionsDefer'

import { elementOffset } from '@webapp/utils/domUtils'
import { SurveyState, useSurveyPreferredLang } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'
import { TestId } from '@webapp/utils/testId'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'
import { getNextSortCriteria, sortNodes } from './nodeDefEntityTableRowsSort'
```

Immediately after the existing `nodeDefColumns` computation (right after its closing `)` — the block that ends with `nodeDefColumnUuids` and returns `nodeDefColumns`), add the sort state, handler and memoized sorted rows:

```js
  const record = useSelector(RecordState.getRecord)
  const lang = useSurveyPreferredLang()

  const [sortCriteria, setSortCriteria] = useState([])

  const handleSortBy = useCallback((field) => {
    setSortCriteria((prevSortCriteria) => getNextSortCriteria({ sortCriteria: prevSortCriteria, field }))
  }, [])

  const sortedNodes = useMemo(
    () =>
      sortCriteria.length === 0
        ? nodes
        : sortNodes({ nodes, sortCriteria, nodeDefColumns, survey, cycle: surveyCycleKey, lang, record }),
    [nodes, sortCriteria, nodeDefColumns, survey, surveyCycleKey, lang, record]
  )
```

In `createRow`, add `onSortBy` and `sortCriteria` to the props passed to `NodeDefEntityTableRow` (gate `onSortBy` on `entry` so no toggle ever renders during Survey Designer's form-design preview):

```js
  const createRow = ({ renderType, node = null, key = undefined, canDelete = true, index = undefined, ref = null }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return (
      <NodeDefEntityTableRow
        id={
          renderType === NodeDefLayout.renderType.tableHeader
            ? TestId.surveyForm.entityRowHeader(nodeDefName)
            : TestId.surveyForm.entityRowData(nodeDefName, index)
        }
        key={key}
        ref={ref}
        canEditDef={canEditDef}
        canEditRecord={canEditRecord}
        canDelete={canDelete}
        edit={edit}
        entry={entry}
        gridSize={gridSize}
        i={index}
        node={node}
        nodeDef={nodeDef}
        nodeDefColumns={nodeDefColumns}
        nodes={null}
        onSortBy={entry ? handleSortBy : undefined}
        parentNode={parentNode}
        preview={preview}
        readOnly={readOnly}
        recordUuid={recordUuid}
        renderType={renderType}
        siblingEntities={nodes}
        sortCriteria={sortCriteria}
        surveyCycleKey={surveyCycleKey}
        surveyInfo={surveyInfo}
      />
    )
  }
```

Finally, in the returned JSX, use `sortedNodes` instead of `nodes` when mapping data rows:

```jsx
            {gridSize.height > 0 &&
              gridSize.width > 0 &&
              sortedNodes.map((node, index) =>
                createRow({
                  renderType: NodeDefLayout.renderType.tableBody,
                  node,
                  key: `entity-table-row-${Node.getUuid(node)}`,
                  canDelete: canDeleteNode,
                  index,
                })
              )}
```

- [ ] **Step 5: Lint and typecheck**

Run:
```bash
npx eslint --cache --fix \
  webapp/components/Table/Header/SortToggle/SortToggle.js \
  webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.js \
  webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch.js \
  webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js
yarn typecheck
```
Expected: both commands exit with no errors.

- [ ] **Step 6: Manual verification in the browser**

Run: `yarn watch`, then open the app (default `http://localhost:9000`).

1. Open (or create) a survey with a multiple entity rendered in **table layout** — e.g. add an entity, set its "multiple" property, and in the layout settings choose table rendering; give it at least a text or number attribute column and a code/coded attribute column.
2. Go to Data → open a record for that survey, and add 4-5 rows to the table-layout entity with distinguishable values in one text/number column (some rows sharing the same value) and leave the value blank on at least one row.
3. Click that column's header. Confirm: first click sorts ascending (arrow points one way), rows reorder; second click sorts descending (arrow flips); third click clears the sort (arrow returns to neutral) and rows return to insertion order.
4. With that column still sorted (asc or desc), click a second column's header. Confirm both columns now show an active arrow **and** a small priority badge (1 and 2) next to each arrow, and rows are ordered by the first column, using the second column only to break ties.
5. Add a new empty row via the "+" button while a sort is active. Confirm it appears pinned at the bottom regardless of the active sort.
6. Confirm the row with the blank value in the sorted column stays last, in both ascending and descending order.
7. Confirm no sort toggle appears on a nested-entity column or a multiple-value attribute column, if the test survey has one.
8. Switch to the Survey Designer's form preview for the same entity (edit/design mode, not data entry) and confirm no sort toggles are rendered on any column header there.
9. Open a `DataQuery` view (Analysis → Data Query, or equivalent) and confirm its column headers' sort behavior and appearance are unchanged from before this change.

- [ ] **Step 7: Commit**

```bash
git add \
  webapp/components/Table/Header/SortToggle/SortToggle.js \
  webapp/components/Table/Header/SortToggle/SortToggle.scss \
  webapp/components/survey/SurveyForm/nodeDefs/components/nodeDefTableCellHeader.js \
  webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch.js \
  webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRows.js
git commit -m "feat: enable multi-column sorting on table-layout entity headers"
```
