# Record Entry Sidebar Status & Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move status icons inline with tree labels (entry only), put expand/collapse above the tree, expand all nodes with visible children by default, roll up status when collapsed, and show the entity form as a white card on grey.

**Architecture:** Extend `TreeView` with optional `renderItemSuffix`. Entry mode wires a status icon suffix via a new `useRecordTreeItemStatus` hook (self-only when expanded, self+descendants when collapsed). Remove `RecordSidebarStatusStrip`. Expand/collapse toolbar is rendered by `NodeDefTreeSelect` when `expandButtonPlacement="above"`. Entry form card via `.survey-form.entry` CSS.

**Tech Stack:** React 18, Redux, MUI (`@mui/material`, `@mui/x-tree-view`), TypeScript, SCSS, `@openforis/arena-core`

## Global Constraints

- Branch: `feat/record-entry-ui-improvements`
- Status icons, rollup, toolbar placement, and white card apply to **entry mode only**
- Designer/edit: keep expand button inside the tree; no status suffix; no white-card class
- No `any` types in TypeScript; JSDoc on every exported function
- Colours from `defaultTokens` / MUI `sx` only
- Path aliases: `@webapp/*`, `@core/*`, `@common/*`
- Manual verification preferred (no new e2e in this iteration)
- Do not bump `@openforis/arena-core` / `@openforis/arena-server`

## File structure

| File | Responsibility |
|------|----------------|
| `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts` | **NEW** — collapsed rollup vs expanded self status |
| `webapp/components/survey/SurveyForm/components/RecordPageStatusIcon.tsx` | **NEW** — shared error/warning/complete icon UI |
| `webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx` | **DELETE** |
| `webapp/components/TreeView/TreeView.js` | Optional `renderItemSuffix(item, { isExpanded })` |
| `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useNodeDefTreeSelect.js` | Expand sync on tree rebuild; expandable keys |
| `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.js` | Pass suffix; `expandButtonPlacement` |
| `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.scss` | Toolbar styles; remove absolute expand when above |
| `webapp/components/survey/SurveyForm/SurveyForm.js` | Wire entry props; remove strip; add `entry` class |
| `webapp/components/survey/SurveyForm/SurveyForm.scss` | Remove strip column; entry white card |

---

### Task 1: Status icon primitive + tree item status hook

**Files:**
- Create: `webapp/components/survey/SurveyForm/components/RecordPageStatusIcon.tsx`
- Create: `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts`
- Modify: `webapp/store/ui/record/hooks/index.js`
- Modify: `webapp/store/ui/record/index.js`

**Interfaces:**
- Consumes: `useRecordPageValidationStatus(pageNodeDefUuid)`, `useRecordPageCompletionPercent(pageNodeDefUuid)`
- Produces:
  - `useRecordTreeItemStatus({ pageNodeDefUuid, descendantPageUuids, isTreeItemExpanded }) → { hasErrors, hasWarnings, isComplete }`
  - `RecordPageStatusIcon({ hasErrors, hasWarnings, isComplete }) → ReactElement | null`

- [ ] **Step 1: Create `RecordPageStatusIcon.tsx`**

Extract icon rendering from the old strip into a pure presentational component:

```tsx
import React from 'react'

import SvgIcon from '@mui/material/SvgIcon'
import Tooltip from '@mui/material/Tooltip'

import { useI18n } from '@webapp/store/system'
import { defaultTokens } from '@webapp/theme/tokens'

type Props = {
  hasErrors: boolean
  hasWarnings: boolean
  isComplete: boolean
}

/**
 * Renders a validation/completion status icon for a record page tree item.
 *
 * @param hasErrors - Whether the scoped page(s) have validation errors
 * @param hasWarnings - Whether the scoped page(s) have validation warnings
 * @param isComplete - Whether the scoped page(s) are fully complete
 * @returns Status icon element, or null when no status applies
 */
export const RecordPageStatusIcon = ({ hasErrors, hasWarnings, isComplete }: Props) => {
  const i18n = useI18n()

  if (hasErrors) {
    return (
      <Tooltip title={i18n.t('common.error_plural')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.red, flexShrink: 0 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  if (hasWarnings) {
    return (
      <Tooltip title={i18n.t('common.warning_plural')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.orange, flexShrink: 0 }}>
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  if (isComplete) {
    return (
      <Tooltip title={i18n.t('surveyForm:pageComplete')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.green, flexShrink: 0 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  return null
}
```

- [ ] **Step 2: Create `useRecordTreeItemStatus.ts`**

```tsx
import { useSelector } from 'react-redux'

import { Objects, Records } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { SurveyState } from '@webapp/store/survey'
import { SurveyFormState } from '@webapp/store/ui/surveyForm'
import * as RecordState from '../state'

export type TreeItemStatus = {
  hasErrors: boolean
  hasWarnings: boolean
  isComplete: boolean
}

type Params = {
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  isTreeItemExpanded: boolean
}

const nodeBelongsToPage = (node: object, pageNodeDefUuid: string, record: object) => {
  if (Node.getNodeDefUuid(node) === pageNodeDefUuid) return true
  return Node.getHierarchy(node).some((ancestorUuid: string) => {
    const ancestor = Record.getNodeByUuid(ancestorUuid)(record)
    return ancestor && Node.getNodeDefUuid(ancestor) === pageNodeDefUuid
  })
}

const getPageValidation = (pageNodeDefUuid: string, record: object) => {
  const recordValidation = Record.getValidation(record)
  const fields = Validation.getFieldValidations(recordValidation)
  let hasErrors = false
  let hasWarnings = false
  for (const nodeUuid of Object.keys(fields)) {
    const node = Record.getNodeByUuid(nodeUuid)(record)
    if (!node || !nodeBelongsToPage(node, pageNodeDefUuid, record)) continue
    const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
    if (!nodeValidation) continue
    if (Validation.isError(nodeValidation)) hasErrors = true
    if (Validation.isWarning(nodeValidation)) hasWarnings = true
    if (hasErrors && hasWarnings) break
  }
  return { hasErrors, hasWarnings }
}

const getPageCompletionPercent = (pageNodeDefUuid: string, state: unknown): number | null => {
  const record = RecordState.getRecord(state)
  if (!record) return null
  const getFn = (Records as Record<string, unknown>).getEntityCompletionPercent
  if (typeof getFn !== 'function') return null
  const pagesUuidMap = SurveyFormState.getPagesUuidMap(state)
  const pageNodeUuid = pagesUuidMap?.[pageNodeDefUuid]
  if (!pageNodeUuid) return null
  const entity = Record.getNodeByUuid(pageNodeUuid)(record)
  if (!entity) return null
  const survey = SurveyState.getSurvey(state)
  return (getFn as (p: { survey: unknown; record: unknown; entity: unknown }) => number)({
    survey,
    record,
    entity,
  })
}

/**
 * Returns status for a sidebar tree page item. When the item is expanded,
 * only that page is considered. When collapsed, status rolls up across the
 * page and all descendant page UUIDs in the rendered tree subtree.
 *
 * @param pageNodeDefUuid - UUID of this tree item's page node def
 * @param descendantPageUuids - Page node def UUIDs under this item in the tree
 * @param isTreeItemExpanded - Whether this tree item is currently expanded
 * @returns Aggregated error/warning/complete flags
 */
export const useRecordTreeItemStatus = ({
  pageNodeDefUuid,
  descendantPageUuids,
  isTreeItemExpanded,
}: Params): TreeItemStatus => {
  return useSelector((state): TreeItemStatus => {
    const record = RecordState.getRecord(state)
    if (!record) return { hasErrors: false, hasWarnings: false, isComplete: false }

    const scopedUuids = isTreeItemExpanded
      ? [pageNodeDefUuid]
      : [pageNodeDefUuid, ...descendantPageUuids]

    let hasErrors = false
    let hasWarnings = false
    let allComplete = scopedUuids.length > 0

    for (const uuid of scopedUuids) {
      const { hasErrors: pageErrors, hasWarnings: pageWarnings } = getPageValidation(uuid, record)
      if (pageErrors) hasErrors = true
      if (pageWarnings) hasWarnings = true
      const percent = getPageCompletionPercent(uuid, state)
      if (percent !== 100) allComplete = false
    }

    return {
      hasErrors,
      hasWarnings,
      isComplete: allComplete && !hasErrors && !hasWarnings,
    }
  }, Objects.isEqual)
}
```

- [ ] **Step 3: Export the new hook**

In `webapp/store/ui/record/hooks/index.js` add:

```js
export { useRecordTreeItemStatus } from './useRecordTreeItemStatus'
```

In `webapp/store/ui/record/index.js` add `useRecordTreeItemStatus` to the named exports list.

- [ ] **Step 4: Commit**

```bash
git add webapp/components/survey/SurveyForm/components/RecordPageStatusIcon.tsx \
  webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts \
  webapp/store/ui/record/hooks/index.js \
  webapp/store/ui/record/index.js
git commit -m "$(cat <<'EOF'
feat(record): add tree item status hook and shared status icon

Support collapsed rollup vs expanded self-only status for entry
sidebar icons, and extract the presentational status icon component.
EOF
)"
```

---

### Task 2: Extend TreeView with `renderItemSuffix`

**Files:**
- Modify: `webapp/components/TreeView/TreeView.js`

**Interfaces:**
- Consumes: existing `TreeView` props
- Produces: `renderItemSuffix?: (item, { isExpanded: boolean }) => React.ReactNode` optional prop; suffix rendered after the label

- [ ] **Step 1: Update `TreeItemView` to accept and render a suffix**

Replace `TreeItemView` so it receives `renderItemSuffix` and `isExpanded`, and pass them to children recursively:

```js
const TreeItemView = (props) => {
  const { item, renderItemSuffix, expandedItemKeys } = props
  const { key, disabled, hasSubPages, icon, label, items, testId } = item
  const isExpanded = Boolean(expandedItemKeys?.includes(key))
  const suffix = renderItemSuffix?.(item, { isExpanded })

  return (
    <MuiTreeItem
      key={key}
      disabled={disabled}
      itemId={key}
      label={
        <div className="tree-item-label display-flex" style={{ width: '100%', minWidth: 0, gap: 4 }}>
          {icon}
          <LabelWithTooltip label={label} />
          {suffix}
        </div>
      }
      data-testid={testId}
    >
      {hasSubPages && !items?.length ? (
        <MuiTreeItem key={`${key}__placeholder`} itemId={`${key}__placeholder`} label="" sx={{ display: 'none' }} />
      ) : (
        items?.map((childItem) => (
          <TreeItemView
            key={childItem.key}
            item={childItem}
            renderItemSuffix={renderItemSuffix}
            expandedItemKeys={expandedItemKeys}
          />
        ))
      )}
    </MuiTreeItem>
  )
}

TreeItemView.propTypes = {
  item: TreeItemPropTypes,
  renderItemSuffix: PropTypes.func,
  expandedItemKeys: PropTypes.array,
}
```

- [ ] **Step 2: Pass props from `TreeView` root**

In `TreeView`, destructure `renderItemSuffix` and pass it plus `expadedItemKeys` as `expandedItemKeys`:

```js
export const TreeView = (props) => {
  const {
    disableSelection,
    items,
    expadedItemKeys = undefined,
    onExpandedItemKeysChange = undefined,
    selectedItemKeys = undefined,
    onSelectedItemKeysChange = undefined,
    renderItemSuffix = undefined,
  } = props

  // ... existing callbacks unchanged ...

  return (
    <SimpleTreeView
      disableSelection={disableSelection}
      expandedItems={expadedItemKeys}
      onExpandedItemsChange={onExpandedItemsChange}
      onSelectedItemsChange={onSelectedItemsChange}
      selectedItems={selectedItemKeys}
    >
      {items.map((childItem) => (
        <TreeItemView
          key={childItem.key}
          item={childItem}
          renderItemSuffix={renderItemSuffix}
          expandedItemKeys={expadedItemKeys}
        />
      ))}
    </SimpleTreeView>
  )
}

TreeView.propTypes = {
  disableSelection: PropTypes.bool,
  expadedItemKeys: PropTypes.array,
  items: PropTypes.arrayOf(TreeItemPropTypes).isRequired,
  onExpandedItemKeysChange: PropTypes.func,
  onSelectedItemKeysChange: PropTypes.func,
  selectedItemKeys: PropTypes.array,
  renderItemSuffix: PropTypes.func,
}
```

- [ ] **Step 3: Commit**

```bash
git add webapp/components/TreeView/TreeView.js
git commit -m "$(cat <<'EOF'
feat(TreeView): support optional per-item label suffix

Allow callers to render content after the tree label (e.g. status
icons) with awareness of each item's expanded state.
EOF
)"
```

---

### Task 3: Expansion sync + NodeDefTreeSelect API

**Files:**
- Modify: `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useNodeDefTreeSelect.js`
- Modify: `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.js`
- Modify: `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.scss`

**Interfaces:**
- Consumes: `TreeView.renderItemSuffix`
- Produces:
  - `useNodeDefTreeSelect` syncs expanded keys when `treeItems` change and `expanded === true`
  - `NodeDefTreeSelect` props: `renderItemSuffix`, `expandButtonPlacement: 'inline' | 'above'` (default `'inline'`)

- [ ] **Step 1: Sync expanded keys on tree rebuild in `useNodeDefTreeSelect.js`**

Ensure the file uses `collectExpandableItemKeys` (already present on the branch). Add a `useEffect` so that when the tree gains visible children and global expand mode is on, newly expandable nodes open:

```js
import { useCallback, useEffect, useMemo, useState } from 'react'

// ... collectExpandableItemKeys unchanged ...

export const useNodeDefTreeSelect = (props) => {
  // ... existing build ...

  const expandableItemKeys = useMemo(() => collectExpandableItemKeys(treeItems), [treeItems])
  const expandableItemKeysKey = expandableItemKeys.join('|')

  const [expanded, setExpanded] = useState(true)
  const [expandedNodeDefUuids, setExpandedNodeDefUuids] = useState(expandableItemKeys)

  useEffect(() => {
    if (expanded) {
      setExpandedNodeDefUuids(expandableItemKeys)
    }
    // Re-sync only when expandable set changes while expanded mode is on.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: expandableItemKeysKey tracks content
  }, [expanded, expandableItemKeysKey])

  const toggleExpanded = useCallback(() => {
    const expandedNext = !expanded
    setExpanded(expandedNext)
    setExpandedNodeDefUuids(expandedNext ? expandableItemKeys : [rootItemKey])
  }, [expanded, expandableItemKeys, rootItemKey])

  // ... rest unchanged; return same shape ...
}
```

- [ ] **Step 2: Update `NodeDefTreeSelect.js` props and layout**

```js
const NodeDefTreeSelect = (props) => {
  const {
    // ... existing props ...
    expandButtonPlacement = 'inline',
    renderItemSuffix = undefined,
  } = props

  const {
    expanded,
    expandedNodeDefUuids,
    onSelectedTreeItemKeyChange,
    selectedTreeItemKeys,
    setExpandedNodeDefUuids,
    toggleExpanded,
    treeItems,
  } = useNodeDefTreeSelect({ /* existing args */ })

  const collapseButtonVisible = treeItems?.length >= 1 && treeItems[0].items?.length > 0

  const expandButton = collapseButtonVisible ? (
    <Button
      className="btn-toggle btn-expand"
      iconClassName={classNames('icon icon-12px', {
        'icon-shrink2': expanded,
        'icon-enlarge2': !expanded,
      })}
      onClick={toggleExpanded}
      size="small"
      title={expanded ? 'common.collapse' : 'common.expand'}
      variant="text"
    />
  ) : null

  return (
    <div
      className={classNames('nodedef-tree-select', {
        'nodedef-tree-select--expand-above': expandButtonPlacement === 'above',
      })}
    >
      {expandButtonPlacement === 'above' && expandButton && (
        <div className="nodedef-tree-select__toolbar">{expandButton}</div>
      )}
      {expandButtonPlacement === 'inline' && expandButton && (
        <div className="display-flex">{expandButton}</div>
      )}

      <TreeView
        disableSelection={disableSelection}
        expadedItemKeys={expandedNodeDefUuids}
        items={treeItems}
        onExpandedItemKeysChange={setExpandedNodeDefUuids}
        onSelectedItemKeysChange={onSelectedTreeItemKeyChange}
        selectedItemKeys={selectedTreeItemKeys}
        renderItemSuffix={renderItemSuffix}
      />
    </div>
  )
}

NodeDefTreeSelect.propTypes = {
  // ... existing ...
  expandButtonPlacement: PropTypes.oneOf(['inline', 'above']),
  renderItemSuffix: PropTypes.func,
}
```

- [ ] **Step 3: Update `NodeDefTreeSelect.scss`**

```scss
.nodedef-tree-select {
  position: relative;
  overflow-y: auto;

  .btn-expand {
    position: absolute;
    right: 4px;
    top: 4px;
    z-index: 2;
  }

  &--expand-above {
    .btn-expand {
      position: static;
    }
  }

  .nodedef-tree-select__toolbar {
    display: flex;
    align-items: center;
    padding: 0 0.25rem;
    min-height: 28px;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useNodeDefTreeSelect.js \
  webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.js \
  webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.scss
git commit -m "$(cat <<'EOF'
feat(NodeDefTreeSelect): expand sync and above-tree toolbar placement

Re-expand visible-child nodes when tree data rebuilds, and support
moving the expand/collapse control above the tree for entry mode.
EOF
)"
```

---

### Task 4: Wire SurveyForm — inline status, remove strip, entry class

**Files:**
- Modify: `webapp/components/survey/SurveyForm/SurveyForm.js`
- Modify: `webapp/components/survey/SurveyForm/SurveyForm.scss`
- Delete: `webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx`

**Interfaces:**
- Consumes: `RecordPageStatusIcon`, `useRecordTreeItemStatus`, `NodeDefTreeSelect` new props, `TreeView` suffix
- Produces: Entry sidebar without status column; inline icons; `survey-form.entry` class

- [ ] **Step 1: Add helper to collect descendant page UUIDs from a tree item**

Add near the top of `SurveyForm.js` (or a small local helper in the same file):

```js
const collectDescendantPageUuids = (item) => {
  const uuids = []
  const visit = (child) => {
    uuids.push(child.key)
    child.items?.forEach(visit)
  }
  item.items?.forEach(visit)
  return uuids
}
```

- [ ] **Step 2: Create entry-only suffix renderer component in the same file or a sibling**

Prefer a small sibling file `webapp/components/survey/SurveyForm/components/RecordTreeItemStatusSuffix.tsx`:

```tsx
import React from 'react'

import { useRecordTreeItemStatus } from '@webapp/store/ui/record'

import { RecordPageStatusIcon } from './RecordPageStatusIcon'

type TreeItemLike = {
  key: string
  items?: TreeItemLike[]
}

type Props = {
  item: TreeItemLike
  isExpanded: boolean
}

const collectDescendantPageUuids = (item: TreeItemLike): string[] => {
  const uuids: string[] = []
  const visit = (child: TreeItemLike) => {
    uuids.push(child.key)
    child.items?.forEach(visit)
  }
  item.items?.forEach(visit)
  return uuids
}

/**
 * Renders the entry-mode status icon for one sidebar tree item.
 *
 * @param item - Tree item (key = page node def UUID)
 * @param isExpanded - Whether the tree item is expanded
 * @returns Status icon element or null
 */
export const RecordTreeItemStatusSuffix = ({ item, isExpanded }: Props) => {
  const descendantPageUuids = collectDescendantPageUuids(item)
  const { hasErrors, hasWarnings, isComplete } = useRecordTreeItemStatus({
    pageNodeDefUuid: item.key,
    descendantPageUuids,
    isTreeItemExpanded: isExpanded,
  })
  return (
    <RecordPageStatusIcon hasErrors={hasErrors} hasWarnings={hasWarnings} isComplete={isComplete} />
  )
}
```

- [ ] **Step 3: Update `SurveyForm.js`**

1. Add `entry` to classNames:
   ```js
   const className = classNames('survey-form', {
     edit: editAllowed,
     entry,
     'form-actions-off': !hasNodeDefAddChildTo,
     'page-navigation-off': !showPageNavigation,
     'form-preview': preview,
   })
   ```

2. Remove `RecordSidebarStatusStrip` import and `allPageNodeDefUuids` memo (no longer needed).

3. Import `RecordTreeItemStatusSuffix`.

4. Replace sidebar block:
   ```js
   {showPageNavigation && (
     <Split sizes={[20, 80]} minSize={[0, 300]}>
       <div className="survey-form__sidebar">
         {entry && <RecordCompletionBar />}
         <NodeDefTreeSelect
           disableSelection={surveyIsDirty}
           isNodeDefIncluded={isNodeDefIncluded}
           nodeDefUuidActive={viewOnlyPages ? NodeDef.getUuid(activePageNodeDef) : selectedNodeDefUuid}
           onlyPages={viewOnlyPages}
           includeMultipleAttributes={!viewOnlyPages}
           includeSingleAttributes={!viewOnlyPages}
           includeSingleEntities
           onSelect={onNodeDefTreeSelect}
           expandButtonPlacement={entry ? 'above' : 'inline'}
           renderItemSuffix={
             entry
               ? (item, { isExpanded }) => (
                   <RecordTreeItemStatusSuffix item={item} isExpanded={isExpanded} />
                 )
               : undefined
           }
         />
         {edit && (
           <div className="display-flex sidebar-bottom-bar">
             {/* unchanged */}
           </div>
         )}
       </div>
       <div className="survey-form__internal-container-wrapper width100 height100">{internalContainer}</div>
     </Split>
   )}
   ```

5. Remove the `survey-form__sidebar-tree-row` wrapper (tree is full width; toolbar is inside `NodeDefTreeSelect` when above).

- [ ] **Step 4: Update `SurveyForm.scss`**

Remove or simplify `.survey-form__sidebar-tree-row` (no longer used). Ensure `.nodedef-tree-select` still flexes:

```scss
.survey-form__sidebar {
  // existing styles...

  .nodedef-tree-select {
    flex: 1;
    min-height: 0;
  }

  // DELETE .survey-form__sidebar-tree-row block
}

.survey-form.entry {
  .survey-form__node-def-entity-wrapper {
    background-color: $white;
  }
}
```

Confirm `$white` is available via existing `@use '~@webapp/style/vars'`.

- [ ] **Step 5: Delete `RecordSidebarStatusStrip.tsx`**

```bash
git rm webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx
```

Grep the repo for `RecordSidebarStatusStrip` and remove any leftover imports.

- [ ] **Step 6: Manual verification**

Run `yarn watch`, open a record in entry mode, confirm:

1. No grey status column beside the tree.
2. Status icons sit after each tree label and scroll with the tree.
3. Expand/collapse button sits above the tree (not overlapping labels).
4. Nodes with visible children start expanded; placeholder-only nodes stay collapsed.
5. Collapsing a parent shows a rollup icon for descendant errors; expanding shows only that page's icon.
6. Form entity area is a white panel on grey; sidebar remains white.
7. Form designer: expand button still top-right inside tree; no status icons.

- [ ] **Step 7: Commit**

```bash
git add webapp/components/survey/SurveyForm/SurveyForm.js \
  webapp/components/survey/SurveyForm/SurveyForm.scss \
  webapp/components/survey/SurveyForm/components/RecordTreeItemStatusSuffix.tsx \
  webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx
git commit -m "$(cat <<'EOF'
feat(survey-form): inline entry status icons and white form card

Remove the sidebar status strip, render status next to tree labels,
place expand/collapse above the tree in entry mode, and style the
entity form as a white card on the grey content area.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Inline status icons next to labels (entry) | Tasks 1–2, 4 |
| Remove status strip column | Task 4 |
| Expand/collapse above tree (entry) | Tasks 3–4 |
| Designer keeps inline expand button | Task 3 (`expandButtonPlacement` default) |
| Expand all nodes with visible children | Task 3 |
| Placeholder-only nodes stay collapsed | Task 3 (`collectExpandableItemKeys`) |
| Sync expand on tree rebuild | Task 3 |
| Collapsed = rollup; expanded = self | Task 1 + 4 |
| White entity card on grey (entry) | Task 4 |
| No arena-core bump | Global constraints |

## Placeholder / consistency notes

- Typo `expadedItemKeys` is intentional — keep existing TreeView prop name; do not rename in this plan.
- Completion rollup treats `null` percent as incomplete (`percent !== 100`).
- `RecordTreeItemStatusSuffix` must be a React component (hooks), not an inline function body that calls hooks inside `renderItemSuffix` without a child component — the plan uses a proper component for that reason.
