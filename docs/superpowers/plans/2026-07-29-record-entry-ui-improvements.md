# Record Entry UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the record-entry UI with five targeted enhancements: always-visible tree expand arrows, grey content background, MUI condensed breadcrumbs, a completion progress bar, and a per-page validation/completion status icon strip.

**Architecture:** Approach A — in-place enhancement. No structural refactoring. New `.tsx` components where files are created fresh; existing `.js` files patched minimally. All colours via `defaultTokens` / MUI theme; no new SCSS files unless unavoidable.

**Tech Stack:** React 18, Redux Toolkit, MUI v5 (`@mui/material`, `@mui/x-tree-view`, `@mui/icons-material`), TypeScript, SCSS (existing), `@openforis/arena-core`, Ramda

## Global Constraints

- Branch: `feat/record-entry-ui-improvements`
- No `any` types in TypeScript files
- No `console.log` — use `log4js` logger on server; omit logging on client unless already present in the file
- Colours only from `webapp/theme/tokens.ts` (`defaultTokens`) or MUI `useTheme()` / `sx`
- JSDoc on every exported function (description ending `.`, `@param`, `@returns`)
- New files are `.tsx`; existing files stay `.js` unless the file is small and fully rewritten
- No new markdown documentation files
- Path aliases: `@webapp/*`, `@core/*`, `@common/*`

---

## Task 1: Always-visible expand arrow in the sidebar tree

**Files:**
- Modify: `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useBuildEntityTreeData.js`

**Interfaces:**
- Produces: `useBuildTreeData` — same signature as before, but `treeItems[n].items` is now always populated for any node def that has page-entity children (even when those children are not the active page)

**Context:** `useBuildTreeData` builds the tree item array passed to `TreeView` → MUI `SimpleTreeView`. MUI only renders the expand arrow for a `TreeItem` when it has React children. Currently, `getNodeDefAvailableChildren` filters out children of hidden/non-active pages, so items with sub-pages sometimes have `items: undefined` and show no arrow. The fix: when `onlyPages=true`, always include page-entity children in the tree data (respecting `isNodeDefIncluded` but **not** the `isPageVisible` filter, which is a runtime-record filter). The `isPageVisible` filter should only hide items when a `record` is present AND the page is explicitly hidden; it should not strip items during tree-structure building when there is no record.

- [ ] **Step 1: Locate the visibility filter in `getNodeDefAvailableChildren`**

  Open `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useBuildEntityTreeData.js`.

  The key section is:
  ```js
  const visibleChildren = pageNode
    ? childrenFiltered.filter((childDef) =>
        isPageVisible({ cycle, record, pageNodeDef: childDef, parentNode: pageNode })
      )
    : childrenFiltered
  ```
  When `pageNode` is `null` (no record loaded yet, or this node def has not been visited), `visibleChildren` equals `childrenFiltered` — children ARE included. When `pageNode` exists (record loaded), children are filtered by `isPageVisible`. This means sub-pages of an active parent correctly get their children, but siblings of the active page whose `pageNode` is also known may get filtered. The actual bug is simpler: MUI's expand toggle only appears when the `items` array is truthy AND non-empty on the **same render**. Because we use a stack-based DFS and only push children onto the stack when `children.length > 0`, items that are filtered to zero children simply never get an `items` key — so no arrow appears.

  The fix: for `onlyPages=true`, we want `items` to always be set (even as an empty array would not help — we need actual child nodes). The real requirement is: **include all page-entity children in the tree unconditionally when `onlyPages=true` and no record is loaded, OR always include the structural children regardless of record state**. The clearest fix: when `onlyPages=true`, use `Survey.getNodeDefChildrenInOwnPage` directly (as already done) but do NOT apply the `isPageVisible` filter — only apply `isNodeDefIncluded`.

- [ ] **Step 2: Update `getNodeDefAvailableChildren` to skip the visibility filter when `onlyPages=true`**

  Replace this block:
  ```js
  const visibleChildren = pageNode
    ? childrenFiltered.filter((childDef) =>
        isPageVisible({ cycle, record, pageNodeDef: childDef, parentNode: pageNode })
      )
    : childrenFiltered
  ```
  With:
  ```js
  // When building the page-only tree, always include structural children so
  // MUI renders the expand toggle for items that have sub-pages. The record-
  // based visibility filter is entry-only and would hide the arrow before the
  // user has navigated to a page.
  const visibleChildren =
    onlyPages || !pageNode
      ? childrenFiltered
      : childrenFiltered.filter((childDef) =>
          isPageVisible({ cycle, record, pageNodeDef: childDef, parentNode: pageNode })
        )
  ```

- [ ] **Step 3: Verify manually**

  Start the app (`yarn watch`), open a survey in data entry mode (`/app/data/record/...`), and confirm that sub-pages in the sidebar tree now show the expand arrow without needing to click.

- [ ] **Step 4: Commit**

  ```bash
  git add webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/useBuildEntityTreeData.js
  git commit -m "fix(survey-form): always show expand arrow for pages with sub-pages"
  ```

---

## Task 2: Grey background for record content area

**Files:**
- Modify: `webapp/components/survey/SurveyForm/SurveyForm.scss`

**Interfaces:**
- Consumes: nothing new
- Produces: visual-only change; `.survey-form__internal-container-wrapper` gets `$greyAppBg` background

- [ ] **Step 1: Add rule to `SurveyForm.scss`**

  Open `webapp/components/survey/SurveyForm/SurveyForm.scss`. The file already imports `~@webapp/style/vars` which exports `$greyAppBg`. Add at the bottom of the file (before the last closing brace if inside a block, or at file level):

  ```scss
  .survey-form__internal-container-wrapper {
    background-color: $greyAppBg;
  }
  ```

- [ ] **Step 2: Verify**

  Open the app in data entry mode. The form content area (right side of the split) should be very slightly grey (`#f6f7f9`) while the sidebar remains white. The difference is subtle but visible when panels are side by side.

- [ ] **Step 3: Commit**

  ```bash
  git add webapp/components/survey/SurveyForm/SurveyForm.scss
  git commit -m "feat(survey-form): grey background for record content area"
  ```

---

## Task 3: MUI Breadcrumbs with responsive maxItems

**Files:**
- Create: `webapp/views/App/Header/Breadcrumbs/Breadcrumbs.tsx`
- Delete: `webapp/views/App/Header/Breadcrumbs/Breadcrumbs.js`
- Modify: `webapp/views/App/Header/Breadcrumbs/Breadcrumbs.scss` (trim to minimal overrides)
- Modify: `webapp/views/App/Header/Breadcrumbs/index.js` (if it re-exports from `.js`)

**Interfaces:**
- Produces: `Breadcrumbs` — same named export, same rendered slot in the app header. No prop changes.

**Context:** The current `Breadcrumbs.js` renders a plain `<div className="breadcrumbs">` with manual `<Link>` + `<span className="separator">` markup. We replace it with MUI `<Breadcrumbs>` that uses a `ResizeObserver` to compute `maxItems` dynamically so crumbs never overflow their container regardless of label length or screen size.

- [ ] **Step 1: Check the index export**

  Open `webapp/views/App/Header/Breadcrumbs/`. If there is an `index.js` that does `export { Breadcrumbs } from './Breadcrumbs'`, note it — we will update the source path after creating the `.tsx` file. The index itself does not need to change if it imports without the extension.

- [ ] **Step 2: Create `Breadcrumbs.tsx`**

  Create `webapp/views/App/Header/Breadcrumbs/Breadcrumbs.tsx` with this content:

  ```tsx
  import React, { useCallback, useEffect, useRef, useState } from 'react'
  import { Link } from 'react-router-dom'

  import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
  import MuiLink from '@mui/material/Link'
  import Typography from '@mui/material/Typography'

  import * as AppModules from '@webapp/app/appModules'
  import { homeModules } from '@webapp/app/appModules'
  import { useI18n } from '@webapp/store/system'
  import { useIsSurveyDirty } from '@webapp/store/survey'
  import { useLocation } from 'react-router'

  type CrumbItem = {
    key: string
    label: string
    uri: string
    isLast: boolean
  }

  const CRUMB_MIN_WIDTH_PX = 60

  /**
   * Computes how many breadcrumb items fit in the container width.
   * Always keeps at least the first and the last item visible.
   */
  const computeMaxItems = (containerWidth: number, itemCount: number): number => {
    if (containerWidth <= 0 || itemCount <= 2) return itemCount
    const available = containerWidth - CRUMB_MIN_WIDTH_PX * 2 // reserve space for first + last
    const middleCount = Math.max(0, Math.floor(available / CRUMB_MIN_WIDTH_PX))
    return Math.min(itemCount, 2 + middleCount)
  }

  /**
   * App-level breadcrumb navigation bar.
   * Uses MUI Breadcrumbs with a ResizeObserver-driven maxItems so crumbs
   * never overflow their container regardless of label length or screen size.
   */
  export const Breadcrumbs = () => {
    const location = useLocation()
    const i18n = useI18n()
    const surveyIsDirty = useIsSurveyDirty()
    const containerRef = useRef<HTMLDivElement>(null)
    const [maxItems, setMaxItems] = useState<number>(10)

    const { pathname } = location
    const pathParts = pathname.split('/')
    const validPathParts = pathParts.filter((part) => part && part !== AppModules.app)

    const crumbs: CrumbItem[] = validPathParts
      .filter((part, idx) => {
        const mod = AppModules.getModuleByPathPart({ levelIndex: idx, pathPart: part })
        return Boolean(mod && mod.key !== homeModules.landing.key)
      })
      .map((part, idx, arr) => {
        const mod = AppModules.getModuleByPathPart({ levelIndex: idx, pathPart: part })
        return {
          key: mod.key,
          label: i18n.t(`appModules.${mod.key}`),
          uri: AppModules.appModuleUri(mod),
          isLast: idx === arr.length - 1,
        }
      })

    const updateMaxItems = useCallback(() => {
      if (containerRef.current) {
        setMaxItems(computeMaxItems(containerRef.current.offsetWidth, crumbs.length))
      }
    }, [crumbs.length])

    useEffect(() => {
      updateMaxItems()
      const observer = new ResizeObserver(updateMaxItems)
      if (containerRef.current) observer.observe(containerRef.current)
      return () => observer.disconnect()
    }, [updateMaxItems])

    return (
      <div ref={containerRef} className="breadcrumbs">
        <MuiBreadcrumbs
          maxItems={maxItems}
          itemsBeforeCollapse={1}
          itemsAfterCollapse={1}
          aria-label="breadcrumb"
        >
          {crumbs.map(({ key, label, uri, isLast }) =>
            isLast ? (
              <Typography key={key} color="text.primary" variant="body2" noWrap>
                {label}
              </Typography>
            ) : surveyIsDirty ? (
              <Typography key={key} color="text.secondary" variant="body2" noWrap>
                {label}
              </Typography>
            ) : (
              <MuiLink
                key={key}
                component={Link}
                to={uri}
                underline="hover"
                color="inherit"
                variant="body2"
                noWrap
              >
                {label}
              </MuiLink>
            )
          )}
        </MuiBreadcrumbs>
      </div>
    )
  }
  ```

- [ ] **Step 3: Trim `Breadcrumbs.scss`**

  Replace the entire content of `webapp/views/App/Header/Breadcrumbs/Breadcrumbs.scss` with:

  ```scss
  .breadcrumbs {
    margin-left: 20px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }
  ```

  (`min-width: 0` and `flex: 1` allow the container to shrink and trigger the `ResizeObserver`.)

- [ ] **Step 4: Delete the old JS file**

  ```bash
  rm webapp/views/App/Header/Breadcrumbs/Breadcrumbs.js
  ```

- [ ] **Step 5: Verify**

  Open the app and navigate to a deeply nested page (e.g. a record inside a survey). Confirm that:
  - Crumbs render correctly for short paths (1–3 levels)
  - Long paths show a `…` button in the middle that expands on click
  - Resizing the browser window triggers re-computation (no overflow)
  - When `surveyIsDirty`, non-last crumbs are rendered as plain text (not links)

- [ ] **Step 6: Commit**

  ```bash
  git add webapp/views/App/Header/Breadcrumbs/Breadcrumbs.tsx \
          webapp/views/App/Header/Breadcrumbs/Breadcrumbs.scss
  git rm webapp/views/App/Header/Breadcrumbs/Breadcrumbs.js
  git commit -m "feat(breadcrumbs): replace with MUI Breadcrumbs with responsive maxItems"
  ```

---

## Task 4: Completion progress bar

**Files:**
- Create: `webapp/store/ui/record/hooks/useRecordCompletionPercent.ts`
- Modify: `webapp/store/ui/record/hooks/index.js` — add export
- Create: `webapp/components/survey/SurveyForm/components/RecordCompletionBar.tsx`
- Modify: `webapp/components/survey/SurveyForm/SurveyForm.js` — render bar above tree
- Modify: `core/i18n/resources/en/surveyForm.js` — add i18n key

**Interfaces:**
- Produces:
  - `useRecordCompletionPercent(): number | null` — overall record completion 0–100, or `null` if arena-core API not yet available
  - `<RecordCompletionBar />` — renders nothing when percent is null; renders MUI `LinearProgress` + label otherwise

**Context:** Stefano's arena-core changes are not yet published. The hook must compile and work today returning `null`, and automatically pick up the real value once `@openforis/arena-core` exports the completion API. The pattern: try to import the function; if it is undefined, return `null`.

- [ ] **Step 1: Add i18n key**

  Open `core/i18n/resources/en/surveyForm.js`. Find the exported object and add:
  ```js
  completion: '{{percent}}% complete',
  ```
  (Use the existing file's style — it exports a plain object literal.)

- [ ] **Step 2: Create `useRecordCompletionPercent.ts`**

  Create `webapp/store/ui/record/hooks/useRecordCompletionPercent.ts`:

  ```ts
  import { useSelector } from 'react-redux'

  import { Records } from '@openforis/arena-core'

  import { SurveyState } from '@webapp/store/survey'
  import * as RecordState from '../state'

  /**
   * Returns the overall completion percentage of the current record as a
   * number in [0, 100], or null if the arena-core completion API is not yet
   * available or no record is loaded.
   */
  export const useRecordCompletionPercent = (): number | null => {
    return useSelector((state) => {
      const record = RecordState.getRecord(state)
      if (!record) return null

      // Forward-compat: arena-core may not yet export getCompletionPercent.
      // Remove the optional-chaining guard once the API is published.
      const getCompletionPercent = (Records as Record<string, unknown>)['getCompletionPercent'] as
        | ((record: unknown) => number)
        | undefined

      if (typeof getCompletionPercent !== 'function') return null

      const survey = SurveyState.getSurvey(state)
      return getCompletionPercent({ survey, record })
    })
  }
  ```

  > **Note to implementer:** Once Stefano publishes the arena-core update, replace the dynamic lookup with a direct import:
  > ```ts
  > import { Records } from '@openforis/arena-core'
  > // ...
  > return Records.getCompletionPercent({ survey, record })
  > ```
  > The exact function name and parameter shape must be confirmed with Stefano.

- [ ] **Step 3: Export from hooks index**

  Open `webapp/store/ui/record/hooks/index.js`. Add:
  ```js
  export { useRecordCompletionPercent } from './useRecordCompletionPercent'
  ```

- [ ] **Step 4: Create `RecordCompletionBar.tsx`**

  Create `webapp/components/survey/SurveyForm/components/RecordCompletionBar.tsx`:

  ```tsx
  import React from 'react'

  import Box from '@mui/material/Box'
  import LinearProgress from '@mui/material/LinearProgress'
  import Typography from '@mui/material/Typography'

  import { useI18n } from '@webapp/store/system'
  import { useRecordCompletionPercent } from '@webapp/store/ui/record'

  /**
   * Displays a linear progress bar and percentage label for the current record's
   * completion. Renders nothing when the arena-core completion API is unavailable
   * or no record is loaded.
   */
  export const RecordCompletionBar = () => {
    const i18n = useI18n()
    const percent = useRecordCompletionPercent()

    if (percent === null) return null

    return (
      <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
        <LinearProgress variant="determinate" value={percent} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {i18n.t('surveyForm:completion', { percent: Math.round(percent) })}
        </Typography>
      </Box>
    )
  }
  ```

- [ ] **Step 5: Render `RecordCompletionBar` in `SurveyForm.js`**

  Open `webapp/components/survey/SurveyForm/SurveyForm.js`.

  At the top of the file, add the import (alongside other local imports):
  ```js
  import { RecordCompletionBar } from './components/RecordCompletionBar'
  ```

  In the JSX, locate the `survey-form__sidebar` div:
  ```jsx
  <div className="survey-form__sidebar">
    <NodeDefTreeSelect
  ```
  Insert `RecordCompletionBar` before `NodeDefTreeSelect`, but only in entry mode:
  ```jsx
  <div className="survey-form__sidebar">
    {entry && <RecordCompletionBar />}
    <NodeDefTreeSelect
  ```

- [ ] **Step 6: Verify**

  Run the app in entry mode. While arena-core does not yet export `getCompletionPercent`, the bar should be invisible (no render). Once Stefano's update is published and the hook is updated, the bar should appear with a percentage.

- [ ] **Step 7: Commit**

  ```bash
  git add \
    webapp/store/ui/record/hooks/useRecordCompletionPercent.ts \
    webapp/store/ui/record/hooks/index.js \
    webapp/components/survey/SurveyForm/components/RecordCompletionBar.tsx \
    webapp/components/survey/SurveyForm/SurveyForm.js \
    core/i18n/resources/en/surveyForm.js
  git commit -m "feat(survey-form): add record completion progress bar"
  ```

---

## Task 5: Per-page validation status hook

**Files:**
- Create: `webapp/store/ui/record/hooks/useRecordPageValidationStatus.ts`
- Modify: `webapp/store/ui/record/hooks/index.js` — add export

**Interfaces:**
- Produces:
  ```ts
  type PageValidationStatus = { hasErrors: boolean; hasWarnings: boolean }
  useRecordPageValidationStatus(pageNodeDefUuid: string): PageValidationStatus
  ```

**Context:** The record's validation object is stored at `RecordState.getRecord(state)` and accessed via `Record.getValidation(record)` → `Validation.getFieldValidations(validation)`. Each field key in the validation map is a node UUID. The node's page-entity ancestor is found via `Record.getNodeByUuid` + `Node.getHierarchy`. We need to find all validation field entries whose node belongs to the page identified by `pageNodeDefUuid`.

The simplest correct approach: iterate all nodes in the record that are direct or indirect children of the page-entity node matching `pageNodeDefUuid`, read their individual node validations via `RecordValidation.getNodeValidation(node)(record)`, and aggregate `hasErrors` / `hasWarnings`.

- [ ] **Step 1: Create `useRecordPageValidationStatus.ts`**

  Create `webapp/store/ui/record/hooks/useRecordPageValidationStatus.ts`:

  ```ts
  import { useSelector } from 'react-redux'

  import * as Record from '@core/record/record'
  import * as RecordValidation from '@core/record/recordValidation'
  import * as Validation from '@core/validation/validation'
  import { SurveyState } from '@webapp/store/survey'
  import * as RecordState from '../state'

  export type PageValidationStatus = {
    hasErrors: boolean
    hasWarnings: boolean
  }

  /**
   * Returns aggregated validation status (errors / warnings) for all nodes
   * that belong to the page identified by pageNodeDefUuid.
   *
   * @param pageNodeDefUuid - UUID of the page-entity node definition
   * @returns PageValidationStatus with hasErrors and hasWarnings flags
   */
  export const useRecordPageValidationStatus = (pageNodeDefUuid: string): PageValidationStatus => {
    return useSelector((state): PageValidationStatus => {
      const record = RecordState.getRecord(state)
      if (!record) return { hasErrors: false, hasWarnings: false }

      const survey = SurveyState.getSurvey(state)
      const recordValidation = Record.getValidation(record)
      const fields = Validation.getFieldValidations(recordValidation)

      let hasErrors = false
      let hasWarnings = false

      for (const nodeUuid of Object.keys(fields)) {
        const node = Record.getNodeByUuid(nodeUuid)(record)
        if (!node) continue

        // Check if this node belongs to the page by walking its hierarchy
        const hierarchy: string[] = Record.getNodeHierarchy(node)(record) ?? []
        const pageEntityNode = hierarchy
          .map((ancestorUuid) => Record.getNodeByUuid(ancestorUuid)(record))
          .find((ancestor) => ancestor && Record.getNodeDefUuid(ancestor) === pageNodeDefUuid)

        if (!pageEntityNode) continue

        const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
        if (!nodeValidation) continue

        if (Validation.isError(nodeValidation)) hasErrors = true
        if (Validation.isWarning(nodeValidation)) hasWarnings = true

        if (hasErrors && hasWarnings) break
      }

      return { hasErrors, hasWarnings }
    })
  }
  ```

  > **Note to implementer:** `Record.getNodeHierarchy` and `Record.getNodeDefUuid` may not exist by those names. Check `core/record/_record/recordReader.js` and `core/record/node.js` for the correct helpers:
  > - Node hierarchy: `Node.getHierarchy(node)` returns an array of ancestor node UUIDs (from `@core/record/node`)
  > - Node def UUID: `Node.getNodeDefUuid(node)` or `Node.getDefUuid(node)`
  > Adjust the import and call accordingly.

- [ ] **Step 2: Export from hooks index**

  Open `webapp/store/ui/record/hooks/index.js`. Add:
  ```js
  export { useRecordPageValidationStatus } from './useRecordPageValidationStatus'
  ```

- [ ] **Step 3: Verify the hook compiles**

  Run `yarn build:server:dev` or `yarn build-dev` and confirm no TypeScript errors. (No visual output yet — this hook is consumed in Task 6.)

- [ ] **Step 4: Commit**

  ```bash
  git add \
    webapp/store/ui/record/hooks/useRecordPageValidationStatus.ts \
    webapp/store/ui/record/hooks/index.js
  git commit -m "feat(record): add useRecordPageValidationStatus hook"
  ```

---

## Task 6: Sidebar status icon strip

**Files:**
- Create: `webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx`
- Modify: `webapp/components/survey/SurveyForm/SurveyForm.js` — render strip alongside tree
- Modify: `webapp/components/survey/SurveyForm/SurveyForm.scss` — sidebar layout

**Interfaces:**
- Consumes:
  - `useRecordPageValidationStatus(pageNodeDefUuid: string): PageValidationStatus` (from Task 5)
  - `treeItems` from `SurveyFormState` or `NodeDefTreeSelect` — the flat list of visible page node defs

**Context:** The status strip renders one 32px icon slot per page-level node def visible in the tree, aligned with the tree rows. It sits to the right of `NodeDefTreeSelect` in a flex row. The icon reflects combined validation + (future) completion status.

Because `RecordSidebarStatusStrip` needs to know which page node defs are currently shown in the tree (and in what order), we pass the `treeItemKeys` — the ordered array of node def UUIDs built by `useBuildTreeData`. These are already available in `NodeDefTreeSelect` via `useNodeDefTreeSelect` → `treeItems`. We will pass the page node def UUIDs as a prop.

- [ ] **Step 1: Create `RecordSidebarStatusStrip.tsx`**

  Create `webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx`:

  ```tsx
  import React from 'react'

  import CheckCircleIcon from '@mui/icons-material/CheckCircle'
  import ErrorIcon from '@mui/icons-material/Error'
  import WarningIcon from '@mui/icons-material/Warning'
  import Box from '@mui/material/Box'
  import Tooltip from '@mui/material/Tooltip'

  import { useI18n } from '@webapp/store/system'
  import { useRecordPageValidationStatus } from '@webapp/store/ui/record'
  import { defaultTokens } from '@webapp/theme/tokens'

  type Props = {
    pageNodeDefUuids: string[]
  }

  const ITEM_HEIGHT_PX = 32

  type StatusIconProps = {
    pageNodeDefUuid: string
  }

  /**
   * Renders a single validation status icon for one page node def.
   */
  const StatusIcon = ({ pageNodeDefUuid }: StatusIconProps) => {
    const i18n = useI18n()
    const { hasErrors, hasWarnings } = useRecordPageValidationStatus(pageNodeDefUuid)

    if (hasErrors) {
      return (
        <Tooltip title={i18n.t('common.errors')}>
          <ErrorIcon sx={{ fontSize: 16, color: defaultTokens.colors.red }} />
        </Tooltip>
      )
    }
    if (hasWarnings) {
      return (
        <Tooltip title={i18n.t('common.warnings')}>
          <WarningIcon sx={{ fontSize: 16, color: defaultTokens.colors.orange }} />
        </Tooltip>
      )
    }
    return null
  }

  /**
   * A narrow strip of per-page validation status icons rendered alongside
   * the sidebar navigation tree. Each slot aligns with its corresponding
   * tree row. Visible only in record entry mode.
   *
   * @param pageNodeDefUuids - ordered list of page node def UUIDs currently
   *   rendered in the sidebar tree
   */
  export const RecordSidebarStatusStrip = ({ pageNodeDefUuids }: Props) => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: 24,
          flexShrink: 0,
          overflowY: 'hidden',
        }}
      >
        {pageNodeDefUuids.map((uuid) => (
          <Box
            key={uuid}
            sx={{
              height: ITEM_HEIGHT_PX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StatusIcon pageNodeDefUuid={uuid} />
          </Box>
        ))}
      </Box>
    )
  }
  ```

- [ ] **Step 2: Expose `treeItemKeys` from `NodeDefTreeSelect`**

  Open `webapp/components/survey/NodeDefsSelector/NodeDefTreeSelect/NodeDefTreeSelect.js`.

  `useNodeDefTreeSelect` already returns `treeItems` and other state. We need the flat ordered list of node def UUIDs to pass to the strip. Add an `onTreeItemKeysChange` callback prop, or — simpler — accept an `onTreeItemKeysReady` callback. Actually the cleanest approach: **do not touch `NodeDefTreeSelect`**. Instead, compute the same list directly in `SurveyForm.js` by calling `useBuildTreeData` (which is already imported transitively). However, `SurveyForm.js` does not call `useBuildTreeData` directly.

  The pragmatic approach: in `SurveyForm.js`, obtain the flat page node def UUID list by reading `SurveyFormState` — specifically `SurveyFormState.getFormActivePageNodeDef` gives the active page. For the full list, use the survey's page structure directly:

  In `SurveyForm.js`, add:
  ```js
  import * as Survey from '@core/survey/survey' // already imported
  import * as NodeDefLayout from '@core/survey/nodeDefLayout' // already imported
  ```
  And compute in the component body (inside `SurveyForm`):
  ```js
  // Flat ordered list of page-entity node def UUIDs for the status strip
  const allPageNodeDefUuids = React.useMemo(() => {
    if (!entry || !survey || !surveyCycleKey) return []
    const root = Survey.getNodeDefRoot(survey)
    const result = []
    const stack = [root]
    while (stack.length > 0) {
      const nd = stack.pop()
      result.push(NodeDef.getUuid(nd))
      const children = Survey.getNodeDefChildrenInOwnPage({ nodeDef: nd, cycle: surveyCycleKey })(survey)
      stack.push(...[...children].reverse())
    }
    return result
  }, [entry, survey, surveyCycleKey])
  ```

- [ ] **Step 3: Add import and render `RecordSidebarStatusStrip` in `SurveyForm.js`**

  Add import at the top:
  ```js
  import { RecordSidebarStatusStrip } from './components/RecordSidebarStatusStrip'
  ```

  Locate the `survey-form__sidebar` div content. Wrap `NodeDefTreeSelect` and `RecordSidebarStatusStrip` in a flex row:
  ```jsx
  <div className="survey-form__sidebar">
    {entry && <RecordCompletionBar />}
    <div className="survey-form__sidebar-tree-row">
      <NodeDefTreeSelect
        disableSelection={surveyIsDirty}
        isNodeDefIncluded={(nodeDefArg) =>
          !notAvailablePageEntityDefsUuids.includes(NodeDef.getUuid(nodeDefArg))
        }
        nodeDefUuidActive={viewOnlyPages ? NodeDef.getUuid(activePageNodeDef) : selectedNodeDefUuid}
        onlyPages={viewOnlyPages}
        includeMultipleAttributes={!viewOnlyPages}
        includeSingleAttributes={!viewOnlyPages}
        includeSingleEntities
        onSelect={onNodeDefTreeSelect}
      />
      {entry && <RecordSidebarStatusStrip pageNodeDefUuids={allPageNodeDefUuids} />}
    </div>
    {edit && (
      <div className="display-flex sidebar-bottom-bar">
        ...
      </div>
    )}
  </div>
  ```

- [ ] **Step 4: Add SCSS for the tree row wrapper**

  Open `webapp/components/survey/SurveyForm/SurveyForm.scss`. Add:

  ```scss
  .survey-form__sidebar-tree-row {
    display: flex;
    flex: 1;
    overflow: hidden;

    .nodedef-tree-select {
      flex: 1;
      overflow-y: auto;
    }
  }
  ```

- [ ] **Step 5: Add i18n keys for tooltip labels**

  Open `core/i18n/resources/en/common.js` (check existing structure). Add if not present:
  ```js
  errors: 'Errors',
  warnings: 'Warnings',
  ```
  (These keys may already exist — check before adding.)

- [ ] **Step 6: Verify**

  Open the app in entry mode. For a record with validation errors on one page:
  - That page's row in the sidebar should show a red `ErrorIcon`
  - A page with warnings shows a yellow `WarningIcon`
  - A clean page shows nothing
  - In Designer (edit) mode the strip should not appear

- [ ] **Step 7: Commit**

  ```bash
  git add \
    webapp/components/survey/SurveyForm/components/RecordSidebarStatusStrip.tsx \
    webapp/components/survey/SurveyForm/SurveyForm.js \
    webapp/components/survey/SurveyForm/SurveyForm.scss
  git commit -m "feat(survey-form): add per-page validation status icon strip"
  ```

---

## Self-Review Checklist (run after all tasks)

- [ ] Task 1 — expand arrow: confirmed `useBuildEntityTreeData.js` change does not break non-`onlyPages` mode (the `onlyPages ||` guard ensures existing behaviour for other usages)
- [ ] Task 2 — grey background: `.survey-form__internal-container-wrapper` class confirmed present in `SurveyForm.js` JSX
- [ ] Task 3 — breadcrumbs: `ResizeObserver` cleanup (`observer.disconnect()`) confirmed in `useEffect` return
- [ ] Task 4 — completion bar: `useRecordCompletionPercent` returns `null` gracefully; `RecordCompletionBar` renders nothing when null
- [ ] Task 5 — validation hook: `Node.getHierarchy` / `Node.getNodeDefUuid` exact API confirmed against `core/record/node.js` before shipping
- [ ] Task 6 — status strip: strip does not render in edit/preview mode; `allPageNodeDefUuids` memo has correct deps; `survey-form__sidebar-tree-row` SCSS does not break existing bottom bar in edit mode
