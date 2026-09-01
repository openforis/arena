# Multiple Entity Status Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sidebar child-page status icons reflect the currently selected entity instance, keep multiple parents red until every instance’s subtree is clean, and show per-instance status icons in the entity selector dropdown.

**Architecture:** Extend `@openforis/arena-core` page validation with optional `scopeEntityUuid`, plus helpers for one entity’s subtree status and for aggregating all instances of a multiple page. Arena resolves scope from `pagesUuidMap`, updates `useRecordTreeItemStatus`, and renders the same `RecordPageStatusIcon` in the entity dropdown (MUI `Select`/`MenuItem`, because native `<option>` cannot host React icons). **New Arena UI behavior (1+2+3) is gated behind `EXPERIMENTAL_FEATURES`** so production can ship with the flag off; arena-core APIs stay always available (additive).

**Tech Stack:** TypeScript (arena-core), Jest (arena-core), React 18, Redux, MUI Select, `@openforis/arena-core` / `@openforis/arena-server`, SCSS

## Global Constraints

- Branches:
  - **Arena:** `feat/record-entry-ui-improvements`
  - **arena-core:** `feat/entity-scoped-page-status` (sibling repo `../arena-core`; already checked out locally)
- Spec: `docs/superpowers/specs/2026-08-03-multiple-entity-status-icons-design.md`
- Package: building blocks **1 + 2 + 3** only (no tooltip / block 4)
- **Experimental gate (Stefano):**
  - Arena UI for 1+2+3 only when `useSystemConfigExperimentalFeatures()` is true (`EXPERIMENTAL_FEATURES` env → system config)
  - When flag is **false**: keep today’s tree status (record-wide page validation, expanded = own-only for all pages including multiples, no dropdown status icons)
  - When flag is **true**: apply instance-scoped child pages, all-instance multiple parents, and dropdown icons
  - **arena-core** changes are **not** experimental (optional params / new helpers only; backward compatible)
  - Progress bar never goes behind the flag (stays record-wide either way)
- Icon priority everywhere: error → warning → complete → none
- Progress bar stays **record-wide** (do not pass `scopeEntityUuid` into progress APIs)
- No survey-specific entity names in copy
- Multiple page tree rows (when experimental): **always** all-instance aggregation (expanded and collapsed)
- Single pages (when experimental): keep 2026-07-30 rule (expanded = own page; collapsed = rollup), but each page eval is **instance-scoped** when a scope entity is resolved
- Prefer publishing changes in sibling repo `../arena-core`; Arena consumes via dependency bump (historically through `@openforis/arena-server`). If release is blocked, implement identical helpers under `webapp/store/ui/record/` as a temporary bridge with the same function names/signatures, then delete the bridge when core is bumped
- No `any` in new TypeScript; JSDoc on exported functions
- Entry mode only for UI wiring (designer unchanged)
- Manual verification for UI; unit tests in arena-core for scoping/aggregation

## File structure

| File | Responsibility |
|------|----------------|
| `../arena-core/src/record/_records/recordPagesValidation.ts` | Add `scopeEntityUuid` to page validation; add entity-subtree + multiple-page aggregators |
| `../arena-core/src/record/_records/recordPagesValidation.test.ts` | Unit tests for scoped validation and aggregators |
| `../arena-core/src/record/records.ts` | Re-export new APIs on `Records` |
| Arena `package.json` / yarn lock (via arena-server bump as needed) | Consume new core version |
| `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts` | Scope child pages (1); all-instance multiples (2); **branch on experimentalFeatures** |
| `webapp/store/ui/record/hooks/useEntitySubtreeStatus.ts` | **NEW** — status for one entity UUID (dropdown) |
| `webapp/store/ui/record/hooks/index.js` | Export new hook |
| `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityFormNodeSelect.js` | Dropdown icons (3) when experimental; switch to MUI Select (or keep native select + icons only when flag on) |
| `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityForm.scss` | Align MUI select with existing header layout |

---

### Task 1: arena-core — `scopeEntityUuid` on page validation

**Repo:** `../arena-core` (not the Arena app repo)  
**Branch:** `feat/entity-scoped-page-status`

**Files:**
- Modify: `src/record/_records/recordPagesValidation.ts`
- Modify: `src/record/_records/recordPagesValidation.test.ts`
- Modify: `src/record/records.ts` (only if new exports are added later; this task keeps the existing export name)

**Interfaces:**
- Consumes: `nodeBelongsToOwnPage`, `Nodes.getHierarchy`, `getNodeByUuid`
- Produces: `getPageValidationStatus({ pageNodeDefUuid, descendantPageUuids?, record, scopeEntityUuid?: string })` — when `scopeEntityUuid` is set, only fields whose node (or children-count parent) is that entity or a descendant of it are counted. Omit/`undefined` = today’s record-wide behavior.

- [ ] **Step 1: Write the failing tests**

Append to `src/record/_records/recordPagesValidation.test.ts`:

```typescript
test('getPageValidationStatus with scopeEntityUuid ignores sibling entity instances', async () => {
  const user = createTestAdminUser()
  const survey = await new SurveyBuilder(
    user,
    entityDef(
      'cluster',
      integerDef('cluster_id').key(),
      entityDef(
        'plot',
        integerDef('plot_id').key(),
        entityDef('land_use', textDef('land_use_code').required())
      ).multiple()
    )
  ).build()

  const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
  const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
  const landUseDef = Surveys.getNodeDefByName({ survey, name: 'land_use' }) as NodeDefEntity
  setOwnPage(plotDef, rootDef)
  setOwnPage(landUseDef, plotDef)

  const record = new RecordBuilder(
    user,
    survey,
    entity(
      'cluster',
      attribute('cluster_id', 10),
      entity('plot', attribute('plot_id', 3), entity('land_use', attribute('land_use_code', null))),
      entity('plot', attribute('plot_id', 4), entity('land_use', attribute('land_use_code', 'crop')))
    )
  ).build()

  const landUseCodeDefUuid = Surveys.getNodeDefByName({ survey, name: 'land_use_code' }).uuid
  const landUseCodeNodes = Records.getNodesByDefUuid(landUseCodeDefUuid)(record)
  const plotNodes = Records.getNodesByDefUuid(plotDef.uuid)(record)
  const plot3 = plotNodes.find((n) => Records.getNodeChildrenByDefUuid(n, landUseDef.uuid)(record).length)?.uuid
    ? plotNodes[0]
    : plotNodes[0]
  const plot4 = plotNodes[1]

  // Mark only plot3's land_use_code invalid
  const plot3LandUse = Records.getNodeChildrenByDefUuid(plotNodes[0], landUseDef.uuid)(record)[0]
  const plot3Code = Records.getNodeChildrenByDefUuid(plot3LandUse, landUseCodeDefUuid)(record)[0]
  record.validation = ValidationFactory.createInstance({
    valid: false,
    fields: {
      [plot3Code.uuid]: ValidationFactory.createInstance({
        valid: false,
        errors: [ValidationResultFactory.createInstance({ key: 'required', severity: ValidationSeverity.error })],
      }),
    },
  })

  const landUseDescendants: string[] = []

  expect(
    Records.getPageValidationStatus({
      pageNodeDefUuid: landUseDef.uuid,
      descendantPageUuids: landUseDescendants,
      record,
    })
  ).toEqual({ hasErrors: true, hasWarnings: false })

  expect(
    Records.getPageValidationStatus({
      pageNodeDefUuid: landUseDef.uuid,
      descendantPageUuids: landUseDescendants,
      record,
      scopeEntityUuid: plotNodes[0].uuid,
    })
  ).toEqual({ hasErrors: true, hasWarnings: false })

  expect(
    Records.getPageValidationStatus({
      pageNodeDefUuid: landUseDef.uuid,
      descendantPageUuids: landUseDescendants,
      record,
      scopeEntityUuid: plotNodes[1].uuid,
    })
  ).toEqual({ hasErrors: false, hasWarnings: false })
})
```

Tighten the test when implementing: resolve `plotNodes[0]` / `[1]` explicitly by `plot_id` key values (3 vs 4) instead of array order if the builder order is not guaranteed.

- [ ] **Step 2: Run test to verify it fails**

Run (in `../arena-core`):

```bash
yarn test src/record/_records/recordPagesValidation.test.ts -t "scopeEntityUuid"
```

Expected: FAIL — `scopeEntityUuid` is not accepted / sibling instance still counted.

- [ ] **Step 3: Implement scoping**

In `recordPagesValidation.ts`:

1. Add helper:

```typescript
const nodeIsUnderEntity = (params: { node: Node; entityUuid: string }): boolean => {
  const { node, entityUuid } = params
  if (node.uuid === entityUuid) return true
  return Nodes.getHierarchy(node).includes(entityUuid)
}
```

2. Thread optional `scopeEntityUuid?: string` through `getOwnPageFieldValidationFlags`, `getOwnPageChildrenCountValidationFlags`, and `getPageValidationStatus`.

3. After a node (or children-count parent) passes `nodeBelongsToOwnPage`, if `scopeEntityUuid` is defined, also require `nodeIsUnderEntity({ node, entityUuid: scopeEntityUuid })`.

4. Update the JSDoc on `getPageValidationStatus` to document the optional scope.

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test src/record/_records/recordPagesValidation.test.ts
```

Expected: PASS (including existing cases with no `scopeEntityUuid`).

- [ ] **Step 5: Commit in arena-core**

```bash
git add src/record/_records/recordPagesValidation.ts src/record/_records/recordPagesValidation.test.ts
git commit -m "$(cat <<'EOF'
feat(record): scope page validation to an entity instance

Optional scopeEntityUuid limits getPageValidationStatus to nodes under
that entity so sibling multiple-entity instances are ignored.
EOF
)"
```

---

### Task 2: arena-core — entity subtree status + multiple-page aggregation

**Repo:** `../arena-core`  
**Branch:** `feat/entity-scoped-page-status`

**Files:**
- Modify: `src/record/_records/recordPagesValidation.ts`
- Modify: `src/record/_records/recordPagesValidation.test.ts`
- Modify: `src/record/records.ts`

**Interfaces:**
- Consumes: `getPageValidationStatus` (with scope), `getDescendantPageNodeDefUuids`, `getEntityCompletionPercent`, `getNodesByDefUuid`, `getNodeByUuid`, `getCycle`
- Produces:
  - `EntitySubtreeStatus = { hasErrors: boolean; hasWarnings: boolean; isComplete: boolean }`
  - `getEntitySubtreeStatus({ survey, record, entityUuid, descendantPageUuids }: { survey: Survey; record: Record; entityUuid: string; descendantPageUuids: string[] }): EntitySubtreeStatus | null` — `null` if entity missing
  - `getMultiplePageEntitiesStatus({ survey, record, pageNodeDefUuid, descendantPageUuids }: { survey: Survey; record: Record; pageNodeDefUuid: string; descendantPageUuids: string[] }): EntitySubtreeStatus` — aggregates all instances; empty instances → `{ hasErrors: false, hasWarnings: false, isComplete: false }`

**Aggregation rules for multiple page:**
- `hasErrors` = any instance has errors
- `hasWarnings` = any instance has warnings (even if another has errors; callers still prioritize error for icons)
- `isComplete` = there is ≥1 instance AND every instance has `isComplete === true`

**Entity subtree rules:**
- Validation: OR of `getPageValidationStatus` for the entity’s own page def and each descendant page def, all with `scopeEntityUuid: entityUuid`. For each page def `p`, pass that page’s own descendant list (filter `descendantPageUuids` to those under `p` in the survey page tree, or recompute via `getDescendantPageNodeDefUuids` for each page def).
- Simplest correct approach: caller passes the full descendant page UUID list for the multiple/parent page; for each `pageUuid` in `[entity.nodeDefUuid, ...descendantPageUuids]`, call `getPageValidationStatus({ pageNodeDefUuid: pageUuid, descendantPageUuids: /* descendants of pageUuid that appear in the full list */, record, scopeEntityUuid: entityUuid })`.
- Practical approach in core: accept `survey` + `cycle` and compute per-page descendants with `getDescendantPageNodeDefUuids` for each page def under the entity’s def (including self via walking from entity’s node def). Prefer that to avoid Arena passing inconsistent maps.
- Completion: `getEntityCompletionPercent({ survey, record, entity }) === 100` and not `hasErrors` and not `hasWarnings`.

Recommended signature (self-contained):

```typescript
export type EntitySubtreeStatus = {
  hasErrors: boolean
  hasWarnings: boolean
  isComplete: boolean
}

export const getEntitySubtreeStatus = (params: {
  survey: Survey
  record: Record
  entityUuid: string
  cycle?: string
}): EntitySubtreeStatus | null

export const getMultiplePageEntitiesStatus = (params: {
  survey: Survey
  record: Record
  pageNodeDefUuid: string
  cycle?: string
}): EntitySubtreeStatus
```

- [ ] **Step 1: Write failing tests**

```typescript
test('getEntitySubtreeStatus reflects only that instance subtree', async () => {
  // Same survey shape as Task 1 (cluster → multiple plot → land_use page)
  // plot3 land_use invalid, plot4 ok
  // expect getEntitySubtreeStatus(plot3) → hasErrors true, isComplete false
  // expect getEntitySubtreeStatus(plot4) → hasErrors false, isComplete true (when keys/required filled)
})

test('getMultiplePageEntitiesStatus ORs errors across instances; complete only if all complete', async () => {
  // With plot3 invalid, plot4 ok → hasErrors true, isComplete false
  // After clearing plot3 error and both complete → hasErrors false, isComplete true
  // Zero plot instances → hasErrors false, hasWarnings false, isComplete false
})
```

Fill in builders mirroring Task 1’s survey/record setup.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
yarn test src/record/_records/recordPagesValidation.test.ts -t "getEntitySubtreeStatus|getMultiplePageEntitiesStatus"
```

- [ ] **Step 3: Implement and export**

Implement the two functions in `recordPagesValidation.ts`. Export from `records.ts` and add to the `Records` object. Export the `EntitySubtreeStatus` type.

- [ ] **Step 4: Run full page-validation test file — expect PASS**

```bash
yarn test src/record/_records/recordPagesValidation.test.ts
```

- [ ] **Step 5: Commit in arena-core**

```bash
git add src/record/_records/recordPagesValidation.ts src/record/_records/recordPagesValidation.test.ts src/record/records.ts
git commit -m "$(cat <<'EOF'
feat(record): entity subtree and multiple-page status helpers

Add getEntitySubtreeStatus and getMultiplePageEntitiesStatus for
instance-aware sidebar and dropdown validation icons.
EOF
)"
```

---

### Task 3: Release core and bump Arena dependencies

**Branches:** arena-core `feat/entity-scoped-page-status` → publish; Arena `feat/record-entry-ui-improvements` for the bump commit

**Files:**
- `../arena-core` — version bump / publish per team process
- `../arena-server` — bump `@openforis/arena-core` if that is how Arena receives core (match recent commits on `feat/record-entry-ui-improvements`)
- Arena `package.json` / `yarn.lock` — bump `@openforis/arena-server` (and ensure `@openforis/arena-core` resolves to the new version)

**Interfaces:**
- Consumes: published APIs from Tasks 1–2
- Produces: Arena can `import { Records } from '@openforis/arena-core'` and call `Records.getPageValidationStatus` with `scopeEntityUuid`, `Records.getEntitySubtreeStatus`, `Records.getMultiplePageEntitiesStatus`

- [ ] **Step 1: Publish / tag arena-core** per Open Foris GitHub packages process (same as prior `1.4.x` releases).

- [ ] **Step 2: Bump arena-server’s `@openforis/arena-core` dependency if required; publish arena-server.**

- [ ] **Step 3: In Arena repo**

```bash
yarn up @openforis/arena-server@<new-version>
# or whatever the repo’s usual bump command is; confirm yarn.lock shows the new arena-core
```

Verify in Node:

```bash
node -e "const {Records}=require('@openforis/arena-core'); console.log(typeof Records.getEntitySubtreeStatus, typeof Records.getMultiplePageEntitiesStatus)"
```

Expected: `function function`

- [ ] **Step 4: Commit in Arena**

```bash
git add package.json yarn.lock
git commit -m "$(cat <<'EOF'
chore(deps): bump arena-server for entity subtree status APIs
EOF
)"
```

**Contingency:** If publish is blocked, copy the new functions into `webapp/store/ui/record/recordEntityStatus.ts` (Arena-local), use them from hooks, and leave a `TODO` comment pointing at the core PR. Do not invent different names — keep `getEntitySubtreeStatus` / `getMultiplePageEntitiesStatus` / `scopeEntityUuid` so the swap is mechanical.

---

### Task 4: Arena — instance-scoped tree status (1) + multiple parent (2)

**Branch:** `feat/record-entry-ui-improvements`

**Files:**
- Modify: `webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts`

**Interfaces:**
- Consumes: `Records.getPageValidationStatus` (+ `scopeEntityUuid`), `Records.getMultiplePageEntitiesStatus`, `Records.getEntitySubtreeStatus`, existing `getPageEntity`, `SurveyFormState.getPagesUuidMap`, `NodeDef.isMultiple`, `SystemInfoState.getConfigExperimentalFeatures` (from `@webapp/store/system` / `webapp/store/system/info/state.js` — do **not** call `useSystemConfigExperimentalFeatures` inside `useSelector`)
- Produces: same hook signature as today:
  `useRecordTreeItemStatus({ pageNodeDefUuid, descendantPageUuids, descendantPageUuidsByPage, isTreeItemExpanded }) → TreeItemStatus`

- [ ] **Step 0: Experimental gate — keep legacy path when flag is off**

At the start of the `useSelector` callback, if experimental features is false, run **exactly the current logic** (no `scopeEntityUuid`, no `getMultiplePageEntitiesStatus`, expanded = own-only for multiples too):

```typescript
import * as SystemInfoState from '@webapp/store/system/info/state' // or the project’s public SystemInfo export

const experimentalFeatures = SystemInfoState.getConfigExperimentalFeatures(state)
if (!experimentalFeatures) {
  // existing evaluatePage / rollupCollapsedStatus without scope or multiple special-case
}
```

- [ ] **Step 1: Update `evaluatePage` to accept and pass scope (experimental path only)**

Change validation call to:

```typescript
const entity = getPageEntity(uuid, state)
const scopeEntityUuid = entity ? entity.uuid : undefined
// For multiple page defs, callers must not use this path for the tree row itself (see Step 2).
// For single/nested pages: if parent multiple is unresolved, getPageEntity returns null → no scope → return empty validation (do not call unscoped getPageValidationStatus).
const pageNodeDef = Survey.getNodeDefByUuid(uuid)(SurveyState.getSurvey(state))
const mustScope = /* true when any ancestor page def is multiple — safest: if getPageEntity is null and an ancestor is multiple, treat as unresolved */
```

Concrete rule matching the spec:

```typescript
const evaluatePage = (...): PageEvalResult => {
  const survey = SurveyState.getSurvey(state)
  const pageNodeDef = Survey.getNodeDefByUuid(uuid)(survey)
  const entity = getPageEntity(uuid, state)

  // Unresolved page under a multiple ancestor: do not fall back to record-wide validation.
  if (!entity && pageNodeDef && NodeDef.isMultiple(Survey.getNodeDefParent(pageNodeDef)(survey))) {
    return { hasErrors: false, hasWarnings: false, hasCompletableContent: false, isComplete: false }
  }
  // Broader: if entity is null and any multiple ancestor exists without pagesUuidMap entry, return empty.
  // Implement by walking parents with Survey.getNodeDefParent until root; if any is multiple and pagesUuidMap lacks that def uuid (and no single-entity fallback applies), return empty.

  const scopeEntityUuid = entity?.uuid
  const { hasErrors, hasWarnings } = Records.getPageValidationStatus({
    pageNodeDefUuid: uuid,
    descendantPageUuids: pageDescendants,
    record,
    ...(scopeEntityUuid ? { scopeEntityUuid } : {}),
  })
  // completion unchanged via getPageEntity + getEntityOwnCompletionPercent
  ...
}
```

When the page itself is single and parents are single, `scopeEntityUuid` may be omitted (record-wide === single instance). Prefer always passing `scopeEntityUuid` when `entity` is resolved — safer and consistent.

- [ ] **Step 2: Branch multiples at the top of the experimental path**

```typescript
export const useRecordTreeItemStatus = (params: Params): TreeItemStatus => {
  return useSelector((state): TreeItemStatus => {
    const record = RecordState.getRecord(state)
    if (!record) return EMPTY_STATUS

    const experimentalFeatures = /* SystemInfo experimental flag from state */
    if (!experimentalFeatures) {
      return legacyTreeItemStatus(state, params) // current behavior
    }

    const survey = SurveyState.getSurvey(state)
    const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)
    if (pageNodeDef && NodeDef.isMultiple(pageNodeDef)) {
      const status = Records.getMultiplePageEntitiesStatus({
        survey,
        record,
        pageNodeDefUuid,
        cycle: Record.getCycle(record),
      })
      return {
        hasErrors: status.hasErrors,
        hasWarnings: status.hasWarnings,
        isComplete: status.isComplete,
      }
    }

    if (isTreeItemExpanded) {
      const { hasErrors, hasWarnings, isComplete } = evaluatePage(...)
      return { hasErrors, hasWarnings, isComplete }
    }

    return rollupCollapsedStatus(...)
  }, Objects.isEqual)
}
```

Note: for multiples under experimental, **ignore** `isTreeItemExpanded` (spec amendment to 2026-07-30).

- [ ] **Step 3: Manual smoke**

- `EXPERIMENTAL_FEATURES=false`: Stefano scenario still shows today’s (buggy) icons — confirms prod-safe path.
- `EXPERIMENTAL_FEATURES=true`: Plot 3 Land use invalid, Plot 4 OK, on Plot 4 → Land use green, Plot red.

- [ ] **Step 4: Commit in Arena**

```bash
git add webapp/store/ui/record/hooks/useRecordTreeItemStatus.ts
git commit -m "$(cat <<'EOF'
fix(record-entry): experimental instance-scoped tree status

Gate scoped child pages and all-instance multiples behind
EXPERIMENTAL_FEATURES; keep legacy tree status when off.
EOF
)"
```

---

### Task 5: Arena — dropdown status icons (3)

**Branch:** `feat/record-entry-ui-improvements`

**Files:**
- Create: `webapp/store/ui/record/hooks/useEntitySubtreeStatus.ts`
- Modify: `webapp/store/ui/record/hooks/index.js`
- Modify: `webapp/store/ui/record/index.js` (if hooks are re-exported there)
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityFormNodeSelect.js`
- Modify: `webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityForm.scss`

**Interfaces:**
- Consumes: `Records.getEntitySubtreeStatus`, `RecordPageStatusIcon`, `useSystemConfigExperimentalFeatures`
- Produces: `useEntitySubtreeStatus(entityUuid: string | null | undefined): TreeItemStatus` (empty when no uuid)

**Why MUI Select:** Native `<option>` cannot render `RecordPageStatusIcon`. Use MUI `Select` + `MenuItem` with the icon beside the label. Preserve `data-testid` values from `TestId.entities.form.*`.

**Experimental gate:** Status icons (and MUI Select, if icons require it) only when `useSystemConfigExperimentalFeatures()` is true. When false, keep the current native `<select>` with plain labels (no status icons, no layout change in production).

- [ ] **Step 1: Add hook**

```typescript
// webapp/store/ui/record/hooks/useEntitySubtreeStatus.ts
import { useSelector } from 'react-redux'
import { Objects, Records } from '@openforis/arena-core'
import { SurveyState } from '@webapp/store/survey'
import * as RecordState from '../state'
import { TreeItemStatus } from './useRecordTreeItemStatus'

const EMPTY: TreeItemStatus = { hasErrors: false, hasWarnings: false, isComplete: false }

export const useEntitySubtreeStatus = (entityUuid?: string | null): TreeItemStatus =>
  useSelector((state): TreeItemStatus => {
    if (!entityUuid) return EMPTY
    const record = RecordState.getRecord(state)
    const survey = SurveyState.getSurvey(state)
    if (!record || !survey) return EMPTY
    const status = Records.getEntitySubtreeStatus({ survey, record, entityUuid })
    return status ?? EMPTY
  }, Objects.isEqual)
```

Export from `hooks/index.js`.

- [ ] **Step 2: Add a small option row component** (same file or adjacent)

```tsx
const EntitySelectOptionLabel = ({ nodeUuid, label }) => {
  const { hasErrors, hasWarnings, isComplete } = useEntitySubtreeStatus(nodeUuid)
  return (
    <span className="node-select-option">
      <span className="node-select-option__label">{label}</span>
      <RecordPageStatusIcon hasErrors={hasErrors} hasWarnings={hasWarnings} isComplete={isComplete} />
    </span>
  )
}
```

Note: hooks cannot be called inside a loop of components unless each option is its own component — `EntitySelectOptionLabel` as a child component per `MenuItem` is correct.

- [ ] **Step 3: Conditionally use MUI `Select` when experimental**

```javascript
const experimentalFeatures = useSystemConfigExperimentalFeatures()

if (!experimentalFeatures) {
  // existing native <select> + plain option labels (current code path)
} else {
  // MUI Select + MenuItem + EntitySelectOptionLabel
}
```

Keep `value={selectedNode ? Node.getUuid(selectedNode) : ''}`, `onChange` calling `onChange(e.target.value)`, placeholder item disabled, same test ids on the select root and options (`MenuItem` `data-testid`).

Layout: `MenuItem` content = `EntitySelectOptionLabel`. Selected value render via `renderValue` showing the key label (+ optional icon for selected).

- [ ] **Step 4: SCSS**

Ensure `.node-select` / `.node-select-option` keep header alignment (icon 16px, gap, no overflow). Match existing entry form header density. Styles for the experimental select must not break the legacy native select.

- [ ] **Step 5: Manual check**

- Flag **off**: dropdown looks/behaves as today (no icons).
- Flag **on**: Plot 3 red, Plot 4 green/complete; selecting Plot 4 does not clear Plot’s tree red until Plot 3 is fixed.

- [ ] **Step 6: Commit**

```bash
git add webapp/store/ui/record/hooks/useEntitySubtreeStatus.ts \
  webapp/store/ui/record/hooks/index.js \
  webapp/store/ui/record/index.js \
  webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityFormNodeSelect.js \
  webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityForm.scss
git commit -m "$(cat <<'EOF'
feat(record-entry): experimental status icons in entity dropdown

Show per-instance subtree status in the multiple-entity selector
when EXPERIMENTAL_FEATURES is enabled.
EOF
)"
```

---

### Task 6: Manual acceptance (Stefano scenario)

**Files:** none (verification only)

- [ ] **Step 1:** With `EXPERIMENTAL_FEATURES=false`, confirm tree + dropdown match **pre-change** behavior (safe for production).

- [ ] **Step 2:** Enable `EXPERIMENTAL_FEATURES=true`. Land use mandatory empty on Plot 3, filled on Plot 4; stay on Plot 4 with Plot expanded.
  - Expect: Land use **green**, Plot **red**, dropdown Plot 3 **red** / Plot 4 **ok**.

- [ ] **Step 3:** Fix Plot 3 Land use.
  - Expect: Plot turns **green** only when all plot subtrees are complete.

- [ ] **Step 4:** Collapse Plot — still red if any instance invalid; green only when all complete.

- [ ] **Step 5:** Single (non-multiple) page expanded — still own-fields only; progress bar still record-wide.

- [ ] **Step 6:** If a nested multiple exists, switch parent instance and confirm child dropdown/icons follow selection.

- [ ] **Step 7:** No commit unless fixes were needed; if fixes, commit with `fix(record-entry): …`.

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Child page icons = current instance (1) | Task 1 + Task 4 (experimental on) |
| Multiple parent all-instance status, incl. expanded (2) | Task 2 + Task 4 (experimental on) |
| Complete only if every instance subtree complete | Task 2 |
| Dropdown per-instance icons (3) | Task 2 + Task 5 (experimental on) |
| Same icon priority | Task 5 reuses `RecordPageStatusIcon` |
| Progress bar unchanged | Task 4/5 do not touch progress hook |
| No tooltip (4) | Not scheduled |
| Unresolved multiple → no false sibling icon | Task 4 empty status when entity unresolved |
| Nested multiples | Core scope by entity UUID; dropdown under current parent (existing node list) |
| arena-core home for APIs | Tasks 1–3 (+ contingency bridge) |
| Prod-safe merge via experimental flag | Tasks 4–6: legacy path when `EXPERIMENTAL_FEATURES=false` |

## Placeholder / consistency check

- Function names aligned: `scopeEntityUuid`, `getEntitySubtreeStatus`, `getMultiplePageEntitiesStatus`, `EntitySubtreeStatus` / `TreeItemStatus` field names match.
- Experimental flag: `SystemInfoState.getConfigExperimentalFeatures` / `useSystemConfigExperimentalFeatures`.
- No TBD left in tasks; release process called out explicitly in Task 3.
- MUI Select chosen deliberately because native options cannot render React icons; only used when experimental is on.
