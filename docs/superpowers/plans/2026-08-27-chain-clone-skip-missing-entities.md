# Chain clone: skip analysis attributes for missing entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user cloning a processing chain from another survey opt in to skipping the analysis attributes whose parent entity doesn't exist in the target survey, instead of being blocked entirely.

**Architecture:** Add a `skipMissingEntityAttributes` boolean flag that threads from the dialog checkbox → Redux thunk → API client → Express route → the `cloneChainFromSurvey` manager function, which is the only place with real logic: when the flag is set, it filters out source analysis node defs whose parent entity is missing in the target survey instead of throwing.

**Tech Stack:** Node.js/Express server, pg-promise transactions, React + Redux Toolkit client, Jest integration tests (webpack-bundled, requires a Postgres DB).

## Global Constraints

- Default behavior (flag omitted or `false`) is byte-for-byte unchanged: missing entities still throw `SystemError('chainView.cloneFromAnotherSurveyDialog.missingEntities', { entities })`.
- New manager param name: `skipMissingEntityAttributes` (boolean, default `false`). Use this exact name at every layer (manager, service passthrough, API route body, API client, Redux thunk, dialog state/prop).
- New i18n key: `chainView.cloneFromAnotherSurveyDialog.skipMissingEntities` = `"Skip analysis attributes for entities missing in the target survey"`, added only to `core/i18n/resources/en/common.js` (other locales fall back to English via `fallbackLng`, which is the existing convention for new keys in this codebase).
- No new UI for per-attribute/per-entity counts — the existing found/missing entity list is the only feedback shown.
- No changes to `_sanitizeChainPropsForClone` / `_remapNodeDefUuid` — they already drop refs to node defs not found by name in the target survey.

---

### Task 1: Manager — skip logic in `cloneChainFromSurvey`

**Files:**
- Modify: `server/modules/analysis/manager/chain/index.js:237-286` (function signature + validation block), and the `sourceAnalysisNodeDefs.map` at `server/modules/analysis/manager/chain/index.js:306`
- Test: `test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js` (new file)

**Interfaces:**
- Consumes: existing `Survey`, `NodeDef`, `SystemError`, `ChainRepository`, `SurveyManager` imports already present in the file.
- Produces: `cloneChainFromSurvey({ user, surveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes = false }, client = DB.client)` — same return shape as before (the inserted `Chain` with validation). Later tasks (API route) call this via `AnalysisService.cloneChainFromSurvey({ user, surveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes })`.

- [ ] **Step 1: Write the failing integration test file**

Create `test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js`:

```javascript
import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone chain from another survey - missing entities', () => {
  let sourceSurvey
  let targetSurvey
  let sourceChainUuid

  beforeAll(async () => {
    const user = getContextUser()
    sourceChainUuid = uuidv4()

    // Source survey: root entity "cluster_src" (exists in target) with an analysis attribute,
    // plus a nested multiple entity "plot_src" (missing in target) with its own analysis attribute.
    sourceSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster_src',
        SB.attribute('cluster_id_src', nodeDefType.integer).key(),
        SB.attribute('volume_analysis_src', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid),
        SB.entity(
          'plot_src',
          SB.attribute('plot_id_src', nodeDefType.integer).key(),
          SB.attribute('biomass_analysis_src', nodeDefType.decimal)
            .analysis()
            .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid)
        ).multiple()
      )
    ).buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(sourceSurvey),
      chain: { uuid: sourceChainUuid, props: { name: 'chain_missing_entity_src' } },
    })

    // Target survey only has "cluster_src" - "plot_src" does not exist here.
    targetSurvey = await SB.survey(
      user,
      SB.entity('cluster_src', SB.attribute('cluster_id_tgt', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (sourceSurvey) await SurveyManager.deleteSurvey(Survey.getId(sourceSurvey))
    if (targetSurvey) await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
  })

  test('Cloning without the skip flag throws when an entity is missing in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    await expect(
      AnalysisManager.cloneChainFromSurvey({
        user,
        surveyId: targetSurveyId,
        sourceSurveyId,
        sourceChainUuid,
      })
    ).rejects.toThrow('chainView.cloneFromAnotherSurveyDialog.missingEntities')
  })

  test('Cloning with skipMissingEntityAttributes clones only attributes whose entity exists in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid,
      skipMissingEntityAttributes: true,
    })

    const targetSurveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyId,
      draft: true,
      advanced: true,
      includeAnalysis: true,
    })

    const clonedAttrs = Survey.getNodeDefsArray(targetSurveyRefetched).filter(NodeDef.isAnalysis)
    const clonedNames = clonedAttrs.map(NodeDef.getName)

    // The attribute belonging to "cluster_src" (exists in target) was cloned.
    expect(clonedNames).toContain('volume_analysis_src')
    // The attribute belonging to "plot_src" (missing in target) was skipped.
    expect(clonedNames).not.toContain('biomass_analysis_src')
    // "plot_src" itself was not created in the target survey.
    expect(Survey.getNodeDefByName('plot_src')(targetSurveyRefetched)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to see current pass/fail state**

Integration tests in this repo are webpack-bundled from every file in `test/integration/tests/*.js` into one `dist/__tests__/bundle.integration.js`, then run with Jest against that bundle (there's no per-file entry point, matching how `yarn test:integration` itself works) — so build the bundle once, then use Jest's `-t` name filter to scope to just this describe block:

Run: `yarn build:test:integration && yarn jest:integration -t "Clone chain from another survey - missing entities"`

Expected: the first test ("throws when an entity is missing") already **passes** — current code always throws when entities are missing, flag or not. The second test ("clones with skipMissingEntityAttributes") **fails**, because the manager function doesn't accept/honor the flag yet and throws the same `SystemError` instead of resolving.

If the DB isn't reachable in this environment, note that explicitly instead of claiming the run passed — do not fabricate output.

- [ ] **Step 3: Implement the skip logic**

In `server/modules/analysis/manager/chain/index.js`, change the function signature at line 237:

```javascript
export const cloneChainFromSurvey = async (
  { user, surveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes = false },
  client = DB.client
) =>
  client.tx(async (tx) => {
```

Replace the validation block (currently lines 268-285):

```javascript
    // Validate: every entity that holds a source analysis attribute must exist in target survey by name.
    const missingEntityNames = []
    for (const nd of sourceAnalysisNodeDefs) {
      const parentUuid = NodeDef.getParentUuid(nd)
      const parentEntity = parentUuid ? Survey.getNodeDefByUuid(parentUuid)(sourceSurvey) : null
      if (!parentEntity) {
        throw new Error(`cloneChainFromSurvey: parent entity not found in source survey (parentUuid=${parentUuid})`)
      }
      const parentName = NodeDef.getName(parentEntity)
      if (!targetEntityByName[parentName] && !missingEntityNames.includes(parentName)) {
        missingEntityNames.push(parentName)
      }
    }
    if (missingEntityNames.length > 0 && !skipMissingEntityAttributes) {
      throw new SystemError('chainView.cloneFromAnotherSurveyDialog.missingEntities', {
        entities: missingEntityNames.join(', '),
      })
    }

    // When skipping, drop analysis attributes whose parent entity is missing in the target survey.
    const clonableAnalysisNodeDefs = sourceAnalysisNodeDefs.filter((nd) => {
      const parentEntity = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nd))(sourceSurvey)
      const parentName = NodeDef.getName(parentEntity)
      return !missingEntityNames.includes(parentName)
    })
```

Then, in the "Clone analysis node defs" block (currently around line 306), replace the source array used for cloning:

```javascript
    // Clone analysis node defs, remapping parent entity to target survey and updating chainUuid.
    const usedNames = new Set(Survey.getNodeDefsArray(targetSurvey).map(NodeDef.getName))
    const clonedNodeDefs = clonableAnalysisNodeDefs.map((nd) => {
```

(only the source array changed from `sourceAnalysisNodeDefs` to `clonableAnalysisNodeDefs`; the rest of that block is untouched).

- [ ] **Step 4: Run the test again to verify both pass**

Run: `yarn build:test:integration && yarn jest:integration -t "Clone chain from another survey - missing entities"`

Expected: both tests PASS. Also re-run the existing category-resolution test to confirm no regression:

Run: `yarn jest:integration -t "Clone chain from another survey - category resolution"`

Expected: PASS (unchanged default behavior). (The bundle from the first command already includes this test, so it doesn't need to be rebuilt.)

If the DB isn't reachable, say so explicitly rather than asserting the run passed.

- [ ] **Step 5: Commit**

```bash
git add server/modules/analysis/manager/chain/index.js test/integration/tests/017chainCloneFromSurveyMissingEntityTest.js
git commit -m "feat: allow skipping analysis attributes with missing target entity on chain clone"
```

---

### Task 2: Server API route — forward the flag

**Files:**
- Modify: `server/modules/analysis/api/chainApi.js:29-53`

**Interfaces:**
- Consumes: `AnalysisService.cloneChainFromSurvey({ user, surveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes })` from Task 1 (the manager function is re-exported unchanged through `server/modules/analysis/manager/index.js` and `server/modules/analysis/service/index.js` — no edits needed in either).
- Produces: `POST /survey/:surveyId/chain/clone-from-survey` now reads `skipMissingEntityAttributes` from the request body (default `false` if omitted) and passes it through.

- [ ] **Step 1: Update the route handler**

In `server/modules/analysis/api/chainApi.js`, inside the `/survey/:surveyId/chain/clone-from-survey` handler, change:

```javascript
        const { sourceSurveyId, sourceChainUuid } = Request.getBody(req)
```

to:

```javascript
        const { sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes = false } = Request.getBody(req)
```

and change:

```javascript
        const chain = await AnalysisService.cloneChainFromSurvey({ user, surveyId, sourceSurveyId, sourceChainUuid })
```

to:

```javascript
        const chain = await AnalysisService.cloneChainFromSurvey({
          user,
          surveyId,
          sourceSurveyId,
          sourceChainUuid,
          skipMissingEntityAttributes,
        })
```

- [ ] **Step 2: Verify with lint**

Run: `npx eslint --cache --fix server/modules/analysis/api/chainApi.js`

Expected: no errors.

- [ ] **Step 3: Re-run Task 1's integration tests**

Run: `yarn build:test:integration && yarn jest:integration -t "Clone chain from another survey - missing entities"`

Expected: still PASS (this task doesn't change manager behavior, only the HTTP passthrough — this run is a smoke check that nothing broke). This codebase has no HTTP-level test harness for chain routes (verified: no `supertest`/`request(app)` usage anywhere in `test/`), so the manager-level tests plus this lint pass are the available verification for this task.

- [ ] **Step 4: Commit**

```bash
git add server/modules/analysis/api/chainApi.js
git commit -m "feat: forward skipMissingEntityAttributes through chain clone API route"
```

---

### Task 3: Webapp data layer — API client + Redux thunk

**Files:**
- Modify: `webapp/service/api/analysis/index.js:20-26`
- Modify: `webapp/store/ui/chain/actions/cloneChainFromSurvey.js`

**Interfaces:**
- Consumes: `POST /survey/:surveyId/chain/clone-from-survey` from Task 2, which now accepts `skipMissingEntityAttributes` in the body.
- Produces:
  - `API.cloneChainFromSurvey({ targetSurveyId, sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes })` (default `false`)
  - `ChainActions.cloneChainFromSurvey({ sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes, navigate })` (default `false`) — this is what Task 4's dialog dispatches.

- [ ] **Step 1: Update the API client**

In `webapp/service/api/analysis/index.js`, change:

```javascript
export const cloneChainFromSurvey = async ({ targetSurveyId, sourceSurveyId, sourceChainUuid }) => {
  const { data: chain } = await axios.post(`/api/survey/${targetSurveyId}/chain/clone-from-survey`, {
    sourceSurveyId,
    sourceChainUuid,
  })
  return chain
}
```

to:

```javascript
export const cloneChainFromSurvey = async ({
  targetSurveyId,
  sourceSurveyId,
  sourceChainUuid,
  skipMissingEntityAttributes = false,
}) => {
  const { data: chain } = await axios.post(`/api/survey/${targetSurveyId}/chain/clone-from-survey`, {
    sourceSurveyId,
    sourceChainUuid,
    skipMissingEntityAttributes,
  })
  return chain
}
```

- [ ] **Step 2: Update the Redux thunk**

In `webapp/store/ui/chain/actions/cloneChainFromSurvey.js`, change:

```javascript
export const cloneChainFromSurvey =
  ({ sourceSurveyId, sourceChainUuid, navigate }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())
    try {
      const surveyId = SurveyState.getSurveyId(getState())
      const chain = await API.cloneChainFromSurvey({ targetSurveyId: surveyId, sourceSurveyId, sourceChainUuid })
```

to:

```javascript
export const cloneChainFromSurvey =
  ({ sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes = false, navigate }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())
    try {
      const surveyId = SurveyState.getSurveyId(getState())
      const chain = await API.cloneChainFromSurvey({
        targetSurveyId: surveyId,
        sourceSurveyId,
        sourceChainUuid,
        skipMissingEntityAttributes,
      })
```

(the rest of the function body is unchanged).

- [ ] **Step 3: Verify with lint**

Run: `npx eslint --cache --fix webapp/service/api/analysis/index.js webapp/store/ui/chain/actions/cloneChainFromSurvey.js`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add webapp/service/api/analysis/index.js webapp/store/ui/chain/actions/cloneChainFromSurvey.js
git commit -m "feat: thread skipMissingEntityAttributes through chain clone webapp data layer"
```

---

### Task 4: Dialog UI — checkbox, state, and i18n key

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx`
- Modify: `webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/chainCloneFromSurveyDialog.scss`
- Modify: `core/i18n/resources/en/common.js:815-824`

**Interfaces:**
- Consumes: `ChainActions.cloneChainFromSurvey({ sourceSurveyId, sourceChainUuid, skipMissingEntityAttributes, navigate })` from Task 3; `Checkbox` from `@webapp/components/form` (props: `checked: boolean`, `label: string` (an i18n key, translated internally), `onChange: (checked: boolean) => void`).
- Produces: no new exports — this is the leaf UI consumer.

- [ ] **Step 1: Add the i18n key**

In `core/i18n/resources/en/common.js`, inside `cloneFromAnotherSurveyDialog` (currently lines 815-824), add a new key after `entityMissing`:

```javascript
    cloneFromAnotherSurveyDialog: {
      title: 'Clone chain from another survey',
      sourceSurvey: 'Source survey',
      sourceChain: 'Source chain',
      entityCheck: 'Entity compatibility',
      entityMissing: 'missing in target survey',
      skipMissingEntities: 'Skip analysis attributes for entities missing in the target survey',
      noAnalysisAttributes: 'This chain has no analysis attributes',
      cloneComplete: 'Chain cloned successfully',
      missingEntities: 'Cannot clone: the following entities do not exist in the target survey: {{entities}}',
    },
```

- [ ] **Step 2: Add state and reset logic in the dialog**

In `ChainCloneFromSurveyDialog.tsx`, add a new piece of state near the other `useState` calls (after `loadingEntityCheck`):

```typescript
  const [skipMissingEntities, setSkipMissingEntities] = useState(false)
```

In `onSurveyChange`, reset it alongside the other resets:

```typescript
  const onSurveyChange = useCallback(
    async (item: SurveyItem | null) => {
      setSelectedSurveyItem(item)
      setSelectedChainItem(null)
      setChainItems([])
      setEntityCheckItems([])
      setSkipMissingEntities(false)
      if (!item) return
```

In `onChainChange`, reset it alongside `entityCheckItems`:

```typescript
  const onChainChange = useCallback(
    async (item: ChainItem | null) => {
      setSelectedChainItem(item)
      setEntityCheckItems([])
      setSkipMissingEntities(false)
      if (!item || !selectedSurveyItem) return
```

- [ ] **Step 3: Gate the Clone button on the checkbox**

Change:

```typescript
  const allEntitiesFound = entityCheckItems.every((c) => c.found)
  const confirmDisabled = !selectedSurveyItem || !selectedChainItem || loadingEntityCheck || !allEntitiesFound
```

to:

```typescript
  const allEntitiesFound = entityCheckItems.every((c) => c.found)
  const confirmDisabled =
    !selectedSurveyItem ||
    !selectedChainItem ||
    loadingEntityCheck ||
    (!allEntitiesFound && !skipMissingEntities)
```

- [ ] **Step 4: Pass the flag on confirm**

Change:

```typescript
  const onConfirm = useCallback(() => {
    if (!selectedSurveyItem || !selectedChainItem) return
    dispatch(
      ChainActions.cloneChainFromSurvey({
        sourceSurveyId: selectedSurveyItem.value,
        sourceChainUuid: selectedChainItem.value,
        navigate,
      })
    )
    onClose()
  }, [dispatch, navigate, onClose, selectedChainItem, selectedSurveyItem])
```

to:

```typescript
  const onConfirm = useCallback(() => {
    if (!selectedSurveyItem || !selectedChainItem) return
    dispatch(
      ChainActions.cloneChainFromSurvey({
        sourceSurveyId: selectedSurveyItem.value,
        sourceChainUuid: selectedChainItem.value,
        skipMissingEntityAttributes: skipMissingEntities,
        navigate,
      })
    )
    onClose()
  }, [dispatch, navigate, onClose, selectedChainItem, selectedSurveyItem, skipMissingEntities])
```

- [ ] **Step 5: Render the checkbox**

Add the import at the top of the file, alongside the other `@webapp/components/form` import:

```typescript
import { Checkbox, Dropdown } from '@webapp/components/form'
```

(this replaces the existing standalone `import { Dropdown } from '@webapp/components/form'` line).

Render the checkbox right after the entity-check `FormItem` block, still inside `ModalBody`:

```tsx
        {selectedChainItem && !loadingEntityCheck && entityCheckItems.length > 0 && (
          <FormItem label={i18n.t('chainView.cloneFromAnotherSurveyDialog.entityCheck')}>
            <div className="chain-clone-from-survey-dialog__entity-check-list">
              {entityCheckItems.map(({ entityName, found }) => (
                <div key={entityName} className={found ? 'found' : 'missing'}>
                  <span
                    className={`icon icon-12px ${
                      found
                        ? 'icon-checkmark chain-clone-from-survey-dialog__entity-icon--found'
                        : 'icon-cross chain-clone-from-survey-dialog__entity-icon--missing'
                    }`}
                  />
                  {entityName}
                  {!found && (
                    <span className="chain-clone-from-survey-dialog__entity-missing-label">
                      {' '}
                      ({i18n.t('chainView.cloneFromAnotherSurveyDialog.entityMissing')})
                    </span>
                  )}
                </div>
              ))}
            </div>
            {!allEntitiesFound && (
              <Checkbox
                checked={skipMissingEntities}
                className="chain-clone-from-survey-dialog__skip-missing-checkbox"
                label="chainView.cloneFromAnotherSurveyDialog.skipMissingEntities"
                onChange={setSkipMissingEntities}
              />
            )}
          </FormItem>
        )}
```

(only the new `{!allEntitiesFound && (<Checkbox .../>)}` block is added, right after the closing `</div>` of `entity-check-list` and before the closing `</FormItem>`; everything else in that block is unchanged).

- [ ] **Step 6: Add checkbox spacing to the stylesheet**

In `chainCloneFromSurveyDialog.scss`, add:

```scss
.chain-clone-from-survey-dialog {
  &__entity-check-list {
    .icon {
      margin-right: 0.5em;
    }
  }

  &__entity-icon--found {
    color: #4caf50;
  }

  &__entity-icon--missing {
    color: #e53935;
  }

  &__skip-missing-checkbox {
    margin-top: 0.5em;
  }
}
```

- [ ] **Step 7: Verify with lint**

Run: `npx eslint --cache --fix webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx core/i18n/resources/en/common.js`

Expected: no errors.

- [ ] **Step 8: Manually verify in the browser**

Start the dev server (`yarn watch`), open a survey with an analysis chain whose attributes reference an entity that doesn't exist (by name) in another survey, and open "Clone chain from another survey" from that other survey targeting the first one. Confirm:
- With the checkbox unchecked, Clone is disabled (same as before this change).
- Checking the box enables Clone; confirming it navigates to the newly cloned chain, which contains only the attributes whose entity exists in the target survey.
- For a chain with no missing entities, the checkbox never appears and behavior is unchanged.

If a browser/dev server isn't available in this environment, say so explicitly instead of claiming this was verified.

- [ ] **Step 9: Commit**

```bash
git add webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog.tsx webapp/views/App/views/Analysis/Chains/ChainCloneFromSurveyDialog/chainCloneFromSurveyDialog.scss core/i18n/resources/en/common.js
git commit -m "feat: add skip-missing-entities checkbox to chain clone dialog"
```
