# Chain Lock Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personal, ephemeral lock/unlock toggle to the Chain editor (Analysis module), mirroring the record editor's lock/unlock button — when locked, every editable control in the chain editing surface becomes disabled for the current user.

**Architecture:** A new `chainEditLocked` boolean lives in the existing `webapp/store/ui/chain/` Redux slice, exactly mirroring how `webapp/store/ui/record/` stores `recordEditLocked`. A derived hook `useChainEditable()` (`useAuthCanUseAnalysis() && !chainEditLocked`) is called directly by every leaf form component that needs to disable itself — no prop-drilling through wrapper components. The node-def formula editor (`NodeDefDetails`, shared with the Survey Designer) is left untouched internally and instead wrapped from the Analysis module's route with a small disabling container.

**Tech Stack:** React 18, Redux Toolkit-style hand-written slices (not RTK `createSlice` — this slice uses a plain `actionHandlers` object + `exportReducer`, see `webapp/store/ui/chain/reducer.js`), react-i18next.

## Global Constraints

- No server-side changes, no websocket events — purely client-side Redux UI state (spec: "No server changes, no websocket involvement").
- Lock state is ephemeral: it resets whenever the chain store resets (`chainReset`, `SYSTEM_RESET`, survey create/update/delete) — no explicit new wiring needed, `reducer.js`'s existing `reset` handler already covers this because `chainEditLocked` will be part of `initialState`.
- Every leaf component that needs to respect the lock calls `useChainEditable()` directly rather than receiving an `editable` prop from a parent (spec: "hook-based propagation" design choice).
- `NodeDefDetails` (`webapp/components/survey/NodeDefDetails/`) must not be modified — it's shared with the Survey Designer. Read-only enforcement for it happens in a new wrapper component in the Analysis module only.
- `StatisticalAnalysis/ChainStatisticalAnalysisProps.js`, `StatisticalAnalysis/DimensionsSelector`, and `PValueSelector` are out of scope — confirmed dead code, not rendered anywhere in the current app.
- The category editor (`CategoryDetails`, reachable via "edit" from `FirstPhaseCategorySelector`) is out of scope — categories are survey-wide shared resources, not owned by a single chain, so locking one chain must not restrict editing a category that other chains or node defs may also use.
- Non-mutating/view actions stay enabled when locked: the chain summary Download button, the "show sampling attributes" checkbox (local UI state only), the two "Open RStudio" launch buttons (they don't mutate the chain), and navigation itself (the analysis node def "Edit" link stays clickable — its destination renders read-only instead of being blocked).
- **No automated test infrastructure exists for webapp Redux slices or React components in this codebase** (`test/unit` and `test/e2e` only cover `core`/`server` domain logic — confirmed by inspecting both directories). Each task below is verified manually by running `yarn watch` and exercising the feature in the browser, not by writing Jest/RTL tests. This follows the project's actual existing convention rather than introducing new tooling.
- i18n changes touch all six locale files: `core/i18n/resources/{en,fr,es,pt,ru,mn}/common.js`.

---

## Setup (once, before Task 1)

- [ ] **Step 1: Start the dev server**

Run in a background terminal (leave it running for the rest of this plan):

```bash
yarn watch
```

Expected: webpack dev server on port 9000, backend on port 9090, hot reload enabled for both.

- [ ] **Step 2: Open a chain in the browser**

Navigate to `http://localhost:9000`, log in, open a survey that has at least one processing chain (Analysis module → Chains → click a chain). Keep this tab open; you'll reload/re-check it after each task.

---

### Task 1: Chain edit-lock Redux state + lock/unlock button

**Files:**
- Modify: `webapp/store/ui/chain/state.js`
- Modify: `webapp/store/ui/chain/reducer.js`
- Modify: `webapp/store/ui/chain/actions/actionTypes.js`
- Create: `webapp/store/ui/chain/actions/editLock.js`
- Modify: `webapp/store/ui/chain/actions/index.js`
- Modify: `webapp/store/ui/chain/hooks.js`
- Modify: `webapp/store/ui/chain/index.js`
- Modify: `webapp/views/App/views/Analysis/Chain/ButtonBar/ButtonBar.js`
- Modify: `core/i18n/resources/en/common.js`
- Modify: `core/i18n/resources/fr/common.js`
- Modify: `core/i18n/resources/es/common.js`
- Modify: `core/i18n/resources/pt/common.js`
- Modify: `core/i18n/resources/ru/common.js`
- Modify: `core/i18n/resources/mn/common.js`

**Interfaces:**
- Produces: `ChainState.isChainEditLocked(state)` — reads `chainEditLocked` boolean from `state.ui.chain`.
- Produces: `ChainActionTypes.chainEditLock` — action type string `'ui/chain/edit-lock'`.
- Produces: `ChainActions.toggleEditLock` — a thunk (`(dispatch, getState) => void`), dispatched as `dispatch(ChainActions.toggleEditLock)`.
- Produces: `useChainEditLocked()` — hook, returns boolean.
- Produces: `useChainEditable()` — hook, returns `useAuthCanUseAnalysis() && !useChainEditLocked()`. **This is the hook every later task's components call.**
- Consumes: `useAuthCanUseAnalysis` from `@webapp/store/user` (already exists, `webapp/store/user/hooks.js:64`).

- [ ] **Step 1: Add `isChainEditLocked` to `state.js`**

Current content of `webapp/store/ui/chain/state.js`:

```js
import * as Chain from '@common/analysis/chain'

import * as RecordStep from '@core/record/recordStep'

const getChainState = (state) => state.ui.chain

const getChain = (state) => {
  const chainState = getChainState(state)
  return chainState.chain
}

const getRecordsCountByStep = (state) => {
  const chainState = getChainState(state)
  return chainState.recordsCountByStep
}

const hasRecordsToProcess = (state) => {
  const chain = getChain(state)
  const recordsCountByStep = getRecordsCountByStep(state)
  const totalRecords = Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)
    ? Number(recordsCountByStep[RecordStep.analysisCode]) || 0
    : RecordStep.steps.reduce((acc, step) => {
        const count = Number(recordsCountByStep[step.id]) || 0
        return acc + count
      }, 0)
  return totalRecords > 0
}

export const ChainState = {
  getChain,
  getRecordsCountByStep,
  hasRecordsToProcess,
}
```

Replace it with:

```js
import * as Chain from '@common/analysis/chain'

import * as RecordStep from '@core/record/recordStep'

const getChainState = (state) => state.ui.chain

const getChain = (state) => {
  const chainState = getChainState(state)
  return chainState.chain
}

const getRecordsCountByStep = (state) => {
  const chainState = getChainState(state)
  return chainState.recordsCountByStep
}

const hasRecordsToProcess = (state) => {
  const chain = getChain(state)
  const recordsCountByStep = getRecordsCountByStep(state)
  const totalRecords = Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)
    ? Number(recordsCountByStep[RecordStep.analysisCode]) || 0
    : RecordStep.steps.reduce((acc, step) => {
        const count = Number(recordsCountByStep[step.id]) || 0
        return acc + count
      }, 0)
  return totalRecords > 0
}

const isChainEditLocked = (state) => {
  const chainState = getChainState(state)
  return Boolean(chainState.chainEditLocked)
}

export const ChainState = {
  getChain,
  getRecordsCountByStep,
  hasRecordsToProcess,
  isChainEditLocked,
}
```

- [ ] **Step 2: Add `chainEditLocked` to `reducer.js`**

Current content of `webapp/store/ui/chain/reducer.js`:

```js
import * as RecordStep from '@core/record/recordStep'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  recordsCountByStep: RecordStep.steps.reduce((acc, { id }) => ({ ...acc, [id]: '...' }), {}),
}

const reset = () => initialState

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: reset,

  [SurveyActions.surveyCreate]: reset,
  [SurveyActions.surveyUpdate]: reset,
  [SurveyActions.surveyDelete]: reset,

  [ChainActionTypes.chainReset]: reset,

  [ChainActionTypes.chainUpdate]: (state, { chain }) => ({
    ...state,
    chain,
  }),

  [ChainActionTypes.chainRecordsCountUpdate]: (state, { recordsCountByStep }) => ({
    ...state,
    recordsCountByStep,
  }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
```

Replace it with:

```js
import * as RecordStep from '@core/record/recordStep'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  recordsCountByStep: RecordStep.steps.reduce((acc, { id }) => ({ ...acc, [id]: '...' }), {}),
  chainEditLocked: false,
}

const reset = () => initialState

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: reset,

  [SurveyActions.surveyCreate]: reset,
  [SurveyActions.surveyUpdate]: reset,
  [SurveyActions.surveyDelete]: reset,

  [ChainActionTypes.chainReset]: reset,

  [ChainActionTypes.chainUpdate]: (state, { chain }) => ({
    ...state,
    chain,
  }),

  [ChainActionTypes.chainRecordsCountUpdate]: (state, { recordsCountByStep }) => ({
    ...state,
    recordsCountByStep,
  }),

  [ChainActionTypes.chainEditLock]: (state, { locked }) => ({
    ...state,
    chainEditLocked: locked,
  }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
```

- [ ] **Step 3: Add the action type**

Current content of `webapp/store/ui/chain/actions/actionTypes.js`:

```js
export const ChainActionTypes = {
  chainUpdate: 'ui/chain/update',
  chainReset: 'ui/chain/reset',
  chainRecordsCountUpdate: 'ui/chain/records-count/update',
}
```

Replace it with:

```js
export const ChainActionTypes = {
  chainUpdate: 'ui/chain/update',
  chainReset: 'ui/chain/reset',
  chainRecordsCountUpdate: 'ui/chain/records-count/update',
  chainEditLock: 'ui/chain/edit-lock',
}
```

- [ ] **Step 4: Create the toggle thunk**

Create `webapp/store/ui/chain/actions/editLock.js`:

```js
import { ChainState } from '../state'
import { ChainActionTypes } from './actionTypes'

export const toggleEditLock = (dispatch, getState) => {
  const state = getState()
  const lockedPrev = ChainState.isChainEditLocked(state)
  dispatch({ type: ChainActionTypes.chainEditLock, locked: !lockedPrev })
}
```

This mirrors `webapp/store/ui/record/actions/editLock.js` exactly.

- [ ] **Step 5: Export the thunk from the actions barrel**

Current content of `webapp/store/ui/chain/actions/index.js`:

```js
import { createChain } from './createChain'
import { fetchChain } from './fetchChain'
import { updateChain } from './updateChain'
import { deleteChain } from './deleteChain'
import { resetChainStore } from './resetChainStore'
import { createNodeDef } from './createNodeDef'
import { openRStudio } from './openRStudio'
import { fetchRecordsCountByStep } from './fetchRecordsCountByStep'

export { ChainActionTypes } from './actionTypes'

export const ChainActions = {
  createChain,
  fetchChain,
  updateChain,
  deleteChain,
  resetChainStore,
  createNodeDef,
  openRStudio,
  fetchRecordsCountByStep,
}
```

Replace it with:

```js
import { createChain } from './createChain'
import { fetchChain } from './fetchChain'
import { updateChain } from './updateChain'
import { deleteChain } from './deleteChain'
import { resetChainStore } from './resetChainStore'
import { createNodeDef } from './createNodeDef'
import { openRStudio } from './openRStudio'
import { fetchRecordsCountByStep } from './fetchRecordsCountByStep'
import { toggleEditLock } from './editLock'

export { ChainActionTypes } from './actionTypes'

export const ChainActions = {
  createChain,
  fetchChain,
  updateChain,
  deleteChain,
  resetChainStore,
  createNodeDef,
  openRStudio,
  fetchRecordsCountByStep,
  toggleEditLock,
}
```

- [ ] **Step 6: Add hooks**

Current content of `webapp/store/ui/chain/hooks.js`:

```js
import { useSelector } from 'react-redux'
import { ChainState } from './state'

export const useChain = () => useSelector((state) => ChainState.getChain(state))

export const useChainRecordsCountByStep = () => useSelector((state) => ChainState.getRecordsCountByStep(state))
```

Replace it with:

```js
import { useSelector } from 'react-redux'

import { useAuthCanUseAnalysis } from '@webapp/store/user'

import { ChainState } from './state'

export const useChain = () => useSelector((state) => ChainState.getChain(state))

export const useChainRecordsCountByStep = () => useSelector((state) => ChainState.getRecordsCountByStep(state))

export const useChainEditLocked = () => useSelector((state) => ChainState.isChainEditLocked(state))

export const useChainEditable = () => {
  const canUseAnalysis = useAuthCanUseAnalysis()
  const chainEditLocked = useChainEditLocked()
  return canUseAnalysis && !chainEditLocked
}
```

- [ ] **Step 7: Export the new hooks from the store barrel**

Current content of `webapp/store/ui/chain/index.js`:

```js
export { ChainActions } from './actions'

export { useChain, useChainRecordsCountByStep } from './hooks'

export { ChainReducer } from './reducer'
```

Replace it with:

```js
export { ChainActions } from './actions'

export { useChain, useChainRecordsCountByStep, useChainEditLocked, useChainEditable } from './hooks'

export { ChainReducer } from './reducer'
```

- [ ] **Step 8: Add the lock/unlock button and disable Delete when locked**

Current content of `webapp/views/App/views/Analysis/Chain/ButtonBar/ButtonBar.js`:

```js
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'

import * as API from '@webapp/service/api'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { ButtonDelete, ButtonDownload } from '@webapp/components'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'

const ButtonBar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyId = useSurveyId()
  const chain = useChain()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const deleteChain = () => dispatch(ChainActions.deleteChain({ chain, navigate }))

  return (
    <div className="button-bar">
      <ButtonDownload
        className="chain-summary-download-btn"
        fileName="chain_summary.json"
        label="chainView.downloadSummaryJSON"
        href={API.getChainSummaryExportUrl({ surveyId, chainUuid: Chain.getUuid(chain) })}
        requestParams={{ cycle, lang }}
      />
      <ButtonDelete label="chainView.deleteChain" onClick={deleteChain} />
    </div>
  )
}

export default ButtonBar
```

Replace it with:

```js
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'

import * as API from '@webapp/service/api'
import { ChainActions, useChain, useChainEditLocked } from '@webapp/store/ui/chain'
import { Button, ButtonDelete, ButtonDownload } from '@webapp/components'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

const ButtonBar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyId = useSurveyId()
  const chain = useChain()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const canEditChain = useAuthCanUseAnalysis()
  const chainEditLocked = useChainEditLocked()

  const deleteChain = () => dispatch(ChainActions.deleteChain({ chain, navigate }))
  const toggleEditLock = () => dispatch(ChainActions.toggleEditLock)

  return (
    <div className="button-bar">
      <ButtonDownload
        className="chain-summary-download-btn"
        fileName="chain_summary.json"
        href={API.getChainSummaryExportUrl({ surveyId, chainUuid: Chain.getUuid(chain) })}
        label="chainView.downloadSummaryJSON"
        requestParams={{ cycle, lang }}
      />
      {canEditChain && (
        <Button
          iconClassName={chainEditLocked ? 'icon-lock' : 'icon-unlocked'}
          label={`chainView.${chainEditLocked ? 'unlock' : 'lock'}`}
          onClick={toggleEditLock}
          variant="text"
        />
      )}
      <ButtonDelete disabled={chainEditLocked} label="chainView.deleteChain" onClick={deleteChain} />
    </div>
  )
}

export default ButtonBar
```

- [ ] **Step 9: Add i18n keys to all six locale files**

In `core/i18n/resources/en/common.js`, find this line inside the `chainView` block:

```js
    showSamplingAttributes: 'Show sampling attributes',
```

Change it to:

```js
    showSamplingAttributes: 'Show sampling attributes',
    lock: 'Lock',
    unlock: 'Unlock',
```

In `core/i18n/resources/fr/common.js`, find:

```js
    showSamplingAttributes: "Afficher les attributs d'échantillonnage",
```

Change it to:

```js
    showSamplingAttributes: "Afficher les attributs d'échantillonnage",
    lock: 'Verrouiller',
    unlock: 'Déverrouiller',
```

In `core/i18n/resources/es/common.js`, find:

```js
    showSamplingAttributes: 'Mostrar atributos de muestreo',
```

Change it to:

```js
    showSamplingAttributes: 'Mostrar atributos de muestreo',
    lock: 'Bloquear',
    unlock: 'Desbloquear',
```

In `core/i18n/resources/pt/common.js`, find:

```js
    showSamplingAttributes: 'Mostrar atributos amostrais',
```

Change it to:

```js
    showSamplingAttributes: 'Mostrar atributos amostrais',
    lock: 'Bloquear',
    unlock: 'Desbloquear',
```

In `core/i18n/resources/ru/common.js`, find:

```js
    showSamplingAttributes: 'Показать атрибуты выборки',
```

Change it to:

```js
    showSamplingAttributes: 'Показать атрибуты выборки',
    lock: 'Заблокировать',
    unlock: 'Разблокировать',
```

In `core/i18n/resources/mn/common.js`, find:

```js
    showSamplingAttributes: 'Түүвэрлэх шинж чанаруудыг харуулах',
```

Change it to:

```js
    showSamplingAttributes: 'Түүвэрлэх шинж чанаруудыг харуулах',
    lock: 'Түгжих',
    unlock: 'Түгжээг тайлах',
```

- [ ] **Step 10: Lint the changed files**

```bash
npx eslint --cache --fix webapp/store/ui/chain/state.js webapp/store/ui/chain/reducer.js webapp/store/ui/chain/actions/actionTypes.js webapp/store/ui/chain/actions/editLock.js webapp/store/ui/chain/actions/index.js webapp/store/ui/chain/hooks.js webapp/store/ui/chain/index.js webapp/views/App/views/Analysis/Chain/ButtonBar/ButtonBar.js
```

Expected: no errors.

- [ ] **Step 11: Manually verify in the browser**

In the tab opened during Setup (a chain's editor page):

1. Reload the page.
2. Confirm a new "Lock" button (unlocked padlock icon) appears in the bottom button bar, next to Download and Delete.
3. Click it. Confirm the icon changes to a closed padlock and the label changes to "Unlock".
4. Confirm the Delete button is now visibly disabled (greyed out, unclickable).
5. Click "Unlock". Confirm the icon reverts, label reverts to "Lock", and Delete is clickable again.
6. Nothing else in the form should be affected yet (that's later tasks) — labels, sampling design checkbox, etc. should still be editable regardless of lock state at this point.

- [ ] **Step 12: Commit**

```bash
git add webapp/store/ui/chain/state.js webapp/store/ui/chain/reducer.js webapp/store/ui/chain/actions/actionTypes.js webapp/store/ui/chain/actions/editLock.js webapp/store/ui/chain/actions/index.js webapp/store/ui/chain/hooks.js webapp/store/ui/chain/index.js webapp/views/App/views/Analysis/Chain/ButtonBar/ButtonBar.js core/i18n/resources/en/common.js core/i18n/resources/fr/common.js core/i18n/resources/es/common.js core/i18n/resources/pt/common.js core/i18n/resources/ru/common.js core/i18n/resources/mn/common.js
git commit -m "$(cat <<'EOF'
Add chain edit-lock state and lock/unlock button

EOF
)"
```

---

### Task 2: Make the "Basic" tab read-only when locked

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/ChainBasicProps.js`
- Modify: `webapp/views/App/views/Analysis/Chain/ChainRStudioFieldset.js`

**Interfaces:**
- Consumes: `useChainEditable()` from `@webapp/store/ui/chain` (Task 1).

- [ ] **Step 1: Disable inputs in `ChainBasicProps.js`**

Current content of `webapp/views/App/views/Analysis/Chain/ChainBasicProps.js`:

```js
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useChains, useSurvey } from '@webapp/store/survey'
import { useChain, useChainRecordsCountByStep } from '@webapp/store/ui/chain'

import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ChainRStudioFieldset } from './ChainRStudioFieldset'

export const ChainBasicProps = (props) => {
  const { updateChain } = props

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()
  const chains = useChains()

  const [existsAnotherChainWithSamplingDesign, setExistsAnotherChainWithSamplingDesign] = useState(false)

  const recordsCountByStep = useChainRecordsCountByStep()

  useEffect(() => {
    if (chains) {
      setExistsAnotherChainWithSamplingDesign(
        chains.some((_chain) => Chain.getUuid(_chain) !== Chain.getUuid(chain) && Chain.hasSamplingDesign(_chain))
      )
    }
  }, [chain, chains])

  const validation = Chain.getValidation(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const samplingDesignDisabled =
    existsAnotherChainWithSamplingDesign || (Chain.hasSamplingDesign(chain) && Boolean(baseUnitNodeDef))

  return (
    <div className="chain-basic-props">
      <LabelsEditor
        autoFocus
        labels={chain.props?.labels}
        formLabelKey="chainView.formLabel"
        readOnly={false}
        validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
        onChange={(labels) => updateChain({ ...chain, props: { ...chain.props, labels } })}
      />
      <LabelsEditor
        formLabelKey="common.description"
        labels={chain.props.descriptions}
        onChange={(descriptions) => updateChain({ ...chain, props: { ...chain.props, descriptions } })}
      />
      <FormItem label="chainView.samplingDesign" className="sampling-design-form-item">
        <Checkbox
          checked={Chain.hasSamplingDesign(chain)}
          validation={Validation.getFieldValidation(Chain.keysProps.samplingDesign)(validation)}
          onChange={(value) => updateChain(Chain.assocHasSamplingDesign(value)(chain))}
          disabled={samplingDesignDisabled}
        />
      </FormItem>
      <FormItem label="chainView.records">
        <div className="records-count-wrapper">
          {RecordStep.steps.map(({ id, name }, index) => (
            <div className="records-count" key={id}>
              {index > 0 && <span>-</span>}
              <span>
                {i18n.t('chainView.recordsInStepCount', {
                  recordsCount: recordsCountByStep[id],
                  step: i18n.t(`surveyForm:step.${name}`),
                })}
              </span>
            </div>
          ))}
        </div>
      </FormItem>

      <ChainRStudioFieldset updateChain={updateChain} />
    </div>
  )
}

ChainBasicProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
```

Replace it with:

```js
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useChains, useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable, useChainRecordsCountByStep } from '@webapp/store/ui/chain'

import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ChainRStudioFieldset } from './ChainRStudioFieldset'

export const ChainBasicProps = (props) => {
  const { updateChain } = props

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()
  const chains = useChains()
  const editable = useChainEditable()

  const [existsAnotherChainWithSamplingDesign, setExistsAnotherChainWithSamplingDesign] = useState(false)

  const recordsCountByStep = useChainRecordsCountByStep()

  useEffect(() => {
    if (chains) {
      setExistsAnotherChainWithSamplingDesign(
        chains.some((_chain) => Chain.getUuid(_chain) !== Chain.getUuid(chain) && Chain.hasSamplingDesign(_chain))
      )
    }
  }, [chain, chains])

  const validation = Chain.getValidation(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const samplingDesignDisabled =
    existsAnotherChainWithSamplingDesign || (Chain.hasSamplingDesign(chain) && Boolean(baseUnitNodeDef))

  return (
    <div className="chain-basic-props">
      <LabelsEditor
        autoFocus
        labels={chain.props?.labels}
        formLabelKey="chainView.formLabel"
        readOnly={!editable}
        validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
        onChange={(labels) => updateChain({ ...chain, props: { ...chain.props, labels } })}
      />
      <LabelsEditor
        formLabelKey="common.description"
        labels={chain.props.descriptions}
        readOnly={!editable}
        onChange={(descriptions) => updateChain({ ...chain, props: { ...chain.props, descriptions } })}
      />
      <FormItem label="chainView.samplingDesign" className="sampling-design-form-item">
        <Checkbox
          checked={Chain.hasSamplingDesign(chain)}
          validation={Validation.getFieldValidation(Chain.keysProps.samplingDesign)(validation)}
          onChange={(value) => updateChain(Chain.assocHasSamplingDesign(value)(chain))}
          disabled={samplingDesignDisabled || !editable}
        />
      </FormItem>
      <FormItem label="chainView.records">
        <div className="records-count-wrapper">
          {RecordStep.steps.map(({ id, name }, index) => (
            <div className="records-count" key={id}>
              {index > 0 && <span>-</span>}
              <span>
                {i18n.t('chainView.recordsInStepCount', {
                  recordsCount: recordsCountByStep[id],
                  step: i18n.t(`surveyForm:step.${name}`),
                })}
              </span>
            </div>
          ))}
        </div>
      </FormItem>

      <ChainRStudioFieldset updateChain={updateChain} />
    </div>
  )
}

ChainBasicProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
```

- [ ] **Step 2: Disable inputs in `ChainRStudioFieldset.js`**

Current content of `webapp/views/App/views/Analysis/Chain/ChainRStudioFieldset.js`:

```js
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { Checkbox } from '@webapp/components/form'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import RecordsDropdown from './RecordsDropdown'

export const ChainRStudioFieldset = (props) => {
  const { updateChain } = props

  const dispatch = useDispatch()
  const chain = useChain()
  const validation = Chain.getValidation(chain)

  const _openRStudio = useCallback(
    ({ isLocal = false } = {}) => dispatch(ChainActions.openRStudio({ isLocal })),
    [dispatch]
  )

  const openRStudio = useCallback(() => _openRStudio(), [_openRStudio])
  const openRStudioLocal = useCallback(() => _openRStudio({ isLocal: true }), [_openRStudio])

  return (
    <fieldset className="rstudio-fieldset">
      <legend>RStudio</legend>
      <div className="content">
        <div>
          <Checkbox
            label="chainView.submitOnlyAnalysisStepDataIntoR"
            checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(validation)}
            onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
          />
          <Checkbox
            label="chainView.submitOnlySelectedRecordsIntoR"
            checked={Chain.isSubmitOnlySelectedRecordsIntoR(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.submitOnlySelectedRecordsIntoR)(validation)}
            onChange={(value) => updateChain(Chain.assocSubmitOnlySelectedRecordsIntoR(value)(chain))}
          />
          {Chain.isSubmitOnlySelectedRecordsIntoR(chain) && (
            <RecordsDropdown
              onChange={(selectedRecords) =>
                updateChain(Chain.assocSelectedRecordUuids(selectedRecords.map(Record.getUuid))(chain))
              }
              selectedUuids={Chain.getSelectedRecordUuids(chain)}
            />
          )}
          <Checkbox
            label="chainView.resultsBackFromRStudio"
            checked={Chain.isResultsBackFromRStudio(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.resultsBackFromRStudio)(validation)}
            onChange={(value) => updateChain(Chain.assocResultsBackFromRStudio(value)(chain))}
          />
        </div>
        <ButtonRStudio onClick={openRStudio} />
        <ButtonRStudio isLocal onClick={openRStudioLocal} />
      </div>
    </fieldset>
  )
}

ChainRStudioFieldset.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
```

Replace it with:

```js
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { Checkbox } from '@webapp/components/form'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import RecordsDropdown from './RecordsDropdown'

export const ChainRStudioFieldset = (props) => {
  const { updateChain } = props

  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const validation = Chain.getValidation(chain)

  const _openRStudio = useCallback(
    ({ isLocal = false } = {}) => dispatch(ChainActions.openRStudio({ isLocal })),
    [dispatch]
  )

  const openRStudio = useCallback(() => _openRStudio(), [_openRStudio])
  const openRStudioLocal = useCallback(() => _openRStudio({ isLocal: true }), [_openRStudio])

  return (
    <fieldset className="rstudio-fieldset">
      <legend>RStudio</legend>
      <div className="content">
        <div>
          <Checkbox
            label="chainView.submitOnlyAnalysisStepDataIntoR"
            checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(validation)}
            onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
            disabled={!editable}
          />
          <Checkbox
            label="chainView.submitOnlySelectedRecordsIntoR"
            checked={Chain.isSubmitOnlySelectedRecordsIntoR(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.submitOnlySelectedRecordsIntoR)(validation)}
            onChange={(value) => updateChain(Chain.assocSubmitOnlySelectedRecordsIntoR(value)(chain))}
            disabled={!editable}
          />
          {Chain.isSubmitOnlySelectedRecordsIntoR(chain) && (
            <RecordsDropdown
              onChange={(selectedRecords) =>
                updateChain(Chain.assocSelectedRecordUuids(selectedRecords.map(Record.getUuid))(chain))
              }
              selectedUuids={Chain.getSelectedRecordUuids(chain)}
              disabled={!editable}
            />
          )}
          <Checkbox
            label="chainView.resultsBackFromRStudio"
            checked={Chain.isResultsBackFromRStudio(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.resultsBackFromRStudio)(validation)}
            onChange={(value) => updateChain(Chain.assocResultsBackFromRStudio(value)(chain))}
            disabled={!editable}
          />
        </div>
        <ButtonRStudio onClick={openRStudio} />
        <ButtonRStudio isLocal onClick={openRStudioLocal} />
      </div>
    </fieldset>
  )
}

ChainRStudioFieldset.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
```

Note: the two `ButtonRStudio` launch buttons are intentionally left enabled — they don't mutate the chain, same reasoning as the Download button staying enabled (see Global Constraints).

- [ ] **Step 3: Lint**

```bash
npx eslint --cache --fix webapp/views/App/views/Analysis/Chain/ChainBasicProps.js webapp/views/App/views/Analysis/Chain/ChainRStudioFieldset.js
```

Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

On the chain editor's "Basic" tab:

1. Reload the page. Confirm the label, description, sampling design checkbox, and the three RStudio checkboxes are all normally editable while unlocked.
2. Click "Lock" in the button bar.
3. Confirm: the label/description editors become read-only (typing has no effect), the sampling design checkbox is disabled, and the three RStudio checkboxes are disabled.
4. Confirm the two "Open RStudio" buttons remain clickable (don't need to actually launch RStudio to verify — just check they're not visually disabled).
5. Click "Unlock". Confirm everything is editable again.

- [ ] **Step 5: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/ChainBasicProps.js webapp/views/App/views/Analysis/Chain/ChainRStudioFieldset.js
git commit -m "$(cat <<'EOF'
Make chain basic props and RStudio fieldset read-only when locked

EOF
)"
```

---

### Task 3: Make the "Sampling Design" tab read-only when locked

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`
- Modify: `webapp/views/App/views/Analysis/Chain/BaseUnitSelector/BaseUnitSelector.js`
- Modify: `webapp/views/App/views/Analysis/Chain/SamplingDesignStrategySelector/SamplingDesignStrategySelector.js`
- Modify: `webapp/views/App/views/Analysis/Chain/BaseUnitCodeAttributeSelector.js`
- Modify: `webapp/views/App/views/Analysis/Chain/FirstPhaseCategorySelector/FirstPhaseCategorySelector.js`
- Modify: `webapp/views/App/views/Analysis/Chain/ClusteringEntitySelector.js`

**Interfaces:**
- Consumes: `useChainEditable()` from `@webapp/store/ui/chain` (Task 1).
- Note: `StratumAttributeSelector.js` and `FirstPhaseCommonAttributeSelector.js` need NO changes — they delegate entirely to `BaseUnitCodeAttributeSelector`, which is where the actual `Dropdown` is rendered.

- [ ] **Step 1: Disable `ChainSamplingDesignProps.js`'s own fields**

Current content of `webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js`:

```js
import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import { Checkbox } from '@webapp/components/form'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import BaseUnitSelector from './BaseUnitSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'
import { FirstPhaseCommonAttributeSelector } from './FirstPhaseCommonAttributeSelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'

export const ChainSamplingDesignProps = (props) => {
  const { updateChain } = props

  const survey = useSurvey()
  const chain = useChain()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const validation = Chain.getValidation(chain)

  const updateStatisticalAnalysis = useCallback(
    (updateFn) => {
      const _chainUpdated = Chain.updateStatisticalAnalysis(updateFn)(chain)
      updateChain(_chainUpdated)
    },
    [chain, updateChain]
  )

  const onClusteringOnlyVariancesChange = useCallback(
    (clusteringOnlyVariances) =>
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocClusteringOnlyVariances(clusteringOnlyVariances)),
    [updateStatisticalAnalysis]
  )

  const onNonResponseBiasCorrectionChange = useCallback(
    (value) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocNonResponseBiasCorrection(value)),
    [updateStatisticalAnalysis]
  )

  const onReportingAreaChange = useCallback(
    (value) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocReportingArea(value)),
    [updateStatisticalAnalysis]
  )

  return (
    <div className="chain-sampling-design">
      <div className="form">
        {(Chain.hasSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

        {hasBaseUnit && (
          <>
            <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />

            {ChainSamplingDesign.isStratificationEnabled(samplingDesign) && <StratumAttributeSelector />}
            {/* {ChainSamplingDesign.isPostStratificationEnabled(samplingDesign) && <PostStratificationAttributeSelector />} */}

            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) && <FirstPhaseCategorySelector />}

            {ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(samplingDesign) && (
              <FirstPhaseCommonAttributeSelector />
            )}

            <ClusteringEntitySelector />
          </>
        )}
      </div>
      <div className="form form-right">
        {ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) && (
          <FormItem className="clustering-only-variances" label="chainView.clusteringOnlyVariances">
            <Checkbox
              checked={ChainStatisticalAnalysis.isClusteringOnlyVariances(chainStatisticalAnalysis)}
              validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.clusteringOnlyVariances)(
                validation
              )}
              onChange={onClusteringOnlyVariancesChange}
            />
          </FormItem>
        )}

        <FormItem label="chainView.nonResponseBiasCorrection" info="chainView.nonResponseBiasCorrectionInfo">
          <Checkbox
            checked={ChainStatisticalAnalysis.isNonResponseBiasCorrection(chainStatisticalAnalysis)}
            validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.nonResponseBiasCorrection)(
              validation
            )}
            onChange={onNonResponseBiasCorrectionChange}
          />
        </FormItem>

        <FormItem
          className="reporting-area"
          label="chainView.statisticalAnalysis.reportingArea"
          info="chainView.statisticalAnalysis.reportingAreaInfo"
        >
          <Input
            numberFormat={NumberFormats.decimal()}
            onChange={onReportingAreaChange}
            value={ChainStatisticalAnalysis.getReportingArea(chainStatisticalAnalysis)}
          />
        </FormItem>
      </div>
    </div>
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
```

Replace it with:

```js
import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import { useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable } from '@webapp/store/ui/chain'

import { Checkbox } from '@webapp/components/form'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import BaseUnitSelector from './BaseUnitSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'
import { FirstPhaseCommonAttributeSelector } from './FirstPhaseCommonAttributeSelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'

export const ChainSamplingDesignProps = (props) => {
  const { updateChain } = props

  const survey = useSurvey()
  const chain = useChain()
  const editable = useChainEditable()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const validation = Chain.getValidation(chain)

  const updateStatisticalAnalysis = useCallback(
    (updateFn) => {
      const _chainUpdated = Chain.updateStatisticalAnalysis(updateFn)(chain)
      updateChain(_chainUpdated)
    },
    [chain, updateChain]
  )

  const onClusteringOnlyVariancesChange = useCallback(
    (clusteringOnlyVariances) =>
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocClusteringOnlyVariances(clusteringOnlyVariances)),
    [updateStatisticalAnalysis]
  )

  const onNonResponseBiasCorrectionChange = useCallback(
    (value) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocNonResponseBiasCorrection(value)),
    [updateStatisticalAnalysis]
  )

  const onReportingAreaChange = useCallback(
    (value) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocReportingArea(value)),
    [updateStatisticalAnalysis]
  )

  return (
    <div className="chain-sampling-design">
      <div className="form">
        {(Chain.hasSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

        {hasBaseUnit && (
          <>
            <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />

            {ChainSamplingDesign.isStratificationEnabled(samplingDesign) && <StratumAttributeSelector />}
            {/* {ChainSamplingDesign.isPostStratificationEnabled(samplingDesign) && <PostStratificationAttributeSelector />} */}

            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) && <FirstPhaseCategorySelector />}

            {ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(samplingDesign) && (
              <FirstPhaseCommonAttributeSelector />
            )}

            <ClusteringEntitySelector />
          </>
        )}
      </div>
      <div className="form form-right">
        {ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) && (
          <FormItem className="clustering-only-variances" label="chainView.clusteringOnlyVariances">
            <Checkbox
              checked={ChainStatisticalAnalysis.isClusteringOnlyVariances(chainStatisticalAnalysis)}
              validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.clusteringOnlyVariances)(
                validation
              )}
              onChange={onClusteringOnlyVariancesChange}
              disabled={!editable}
            />
          </FormItem>
        )}

        <FormItem label="chainView.nonResponseBiasCorrection" info="chainView.nonResponseBiasCorrectionInfo">
          <Checkbox
            checked={ChainStatisticalAnalysis.isNonResponseBiasCorrection(chainStatisticalAnalysis)}
            validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.nonResponseBiasCorrection)(
              validation
            )}
            onChange={onNonResponseBiasCorrectionChange}
            disabled={!editable}
          />
        </FormItem>

        <FormItem
          className="reporting-area"
          label="chainView.statisticalAnalysis.reportingArea"
          info="chainView.statisticalAnalysis.reportingAreaInfo"
        >
          <Input
            numberFormat={NumberFormats.decimal()}
            onChange={onReportingAreaChange}
            value={ChainStatisticalAnalysis.getReportingArea(chainStatisticalAnalysis)}
            readOnly={!editable}
          />
        </FormItem>
      </div>
    </div>
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
```

- [ ] **Step 2: Disable `BaseUnitSelector.js`**

Current content of `webapp/views/App/views/Analysis/Chain/BaseUnitSelector/BaseUnitSelector.js`:

```js
import './BaseUnitSelector.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

/*
    BASE_UNIT annotations
    The concept of BaseUnit is quite complex so this is the reason behind of this comments. 

    A base unit is a value contained into a Chain, 
    Some calculations based on some area are needed so this is the reason behind of the base unit.
    - 1.1 First the user has to select the entity that is the reference of the base units 
    - 1.2 Then for every entity below in the hierarchy of this "reference unit" a base unit nodedef analysis should be created 
    - 1.3 The first level (reference level) should have the name of weight -> the default script should be entity_reference_name$weight <- 1
    - 1.4 The children levels should receive the name with the subfix _area -> the default script should be entity_name_children$[entity_reference_name]_area <- NA

    So everytime that this selector changes e should delete all of the baseUnit nodeDefs and recreate all of this tree, 
    
    // TO DEFINE ->  I am not sure about the naming at this moment
    In addition of this, Into the quantitative nodes the user has the possibility to create "Area-based estimate nodedefs" with the following scripts -> entity_name$node_def_name <- entity_name$[tree_volume] / tree$plot_area
*/

const BaseUnitSelector = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()

  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onBaseUnitChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocBaseUnitNodeDefUuid(entityDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )

  if (!chain || A.isEmpty(chain)) return null

  return (
    <FormItem label="common.baseUnit" className="node-def-edit__base-unit">
      <div className="node-def-edit__base-unit-selector">
        <EntitySelector
          hierarchy={Survey.getHierarchy()(survey)}
          nodeDefUuidEntity={ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesign)}
          onChange={onBaseUnitChange}
          showSingleEntities={false}
          useNameAsLabel={true}
          allowEmptySelection={true}
        />
      </div>
    </FormItem>
  )
}

export default BaseUnitSelector
```

Replace it with (only the `useChain` import line and the component body change — the large comment block is preserved verbatim):

```js
import './BaseUnitSelector.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'

import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

/*
    BASE_UNIT annotations
    The concept of BaseUnit is quite complex so this is the reason behind of this comments. 

    A base unit is a value contained into a Chain, 
    Some calculations based on some area are needed so this is the reason behind of the base unit.
    - 1.1 First the user has to select the entity that is the reference of the base units 
    - 1.2 Then for every entity below in the hierarchy of this "reference unit" a base unit nodedef analysis should be created 
    - 1.3 The first level (reference level) should have the name of weight -> the default script should be entity_reference_name$weight <- 1
    - 1.4 The children levels should receive the name with the subfix _area -> the default script should be entity_name_children$[entity_reference_name]_area <- NA

    So everytime that this selector changes e should delete all of the baseUnit nodeDefs and recreate all of this tree, 
    
    // TO DEFINE ->  I am not sure about the naming at this moment
    In addition of this, Into the quantitative nodes the user has the possibility to create "Area-based estimate nodedefs" with the following scripts -> entity_name$node_def_name <- entity_name$[tree_volume] / tree$plot_area
*/

const BaseUnitSelector = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()

  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onBaseUnitChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocBaseUnitNodeDefUuid(entityDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [dispatch, chain]
  )

  if (!chain || A.isEmpty(chain)) return null

  return (
    <FormItem label="common.baseUnit" className="node-def-edit__base-unit">
      <div className="node-def-edit__base-unit-selector">
        <EntitySelector
          hierarchy={Survey.getHierarchy()(survey)}
          nodeDefUuidEntity={ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesign)}
          onChange={onBaseUnitChange}
          showSingleEntities={false}
          useNameAsLabel={true}
          allowEmptySelection={true}
          disabled={!editable}
        />
      </div>
    </FormItem>
  )
}

export default BaseUnitSelector
```

- [ ] **Step 3: Disable `SamplingDesignStrategySelector.js`**

Current content of `webapp/views/App/views/Analysis/Chain/SamplingDesignStrategySelector/SamplingDesignStrategySelector.js`:

```js
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

export const SamplingDesignStrategySelector = (props) => {
  const { chain, updateChain } = props

  const i18n = useI18n()

  const samplingStrategyCodeToItem = (samplingStrategyCode) => ({
    value: samplingStrategyCode,
    label: i18n.t(`chainView.samplingStrategy.${samplingStrategyCode}`),
  })

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }

  const items = [emptyItem, ...Object.values(ChainSamplingDesign.samplingStrategies).map(samplingStrategyCodeToItem)]

  const samplingDesing = Chain.getSamplingDesign(chain)
  const samplingStrategy = ChainSamplingDesign.getSamplingStrategy(samplingDesing)
  const selectedItem = samplingStrategy ? samplingStrategyCodeToItem(samplingStrategy) : emptyItem

  return (
    <FormItem label="chainView.samplingStrategyLabel">
      <Dropdown
        items={items}
        selection={selectedItem}
        onChange={(item) =>
          updateChain(Chain.updateSamplingDesign(ChainSamplingDesign.assocSamplingStrategy(item?.value))(chain))
        }
      />
    </FormItem>
  )
}

SamplingDesignStrategySelector.propTypes = {
  chain: PropTypes.object.isRequired,
  updateChain: PropTypes.func.isRequired,
}
```

Replace it with:

```js
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useChainEditable } from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

export const SamplingDesignStrategySelector = (props) => {
  const { chain, updateChain } = props

  const i18n = useI18n()
  const editable = useChainEditable()

  const samplingStrategyCodeToItem = (samplingStrategyCode) => ({
    value: samplingStrategyCode,
    label: i18n.t(`chainView.samplingStrategy.${samplingStrategyCode}`),
  })

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }

  const items = [emptyItem, ...Object.values(ChainSamplingDesign.samplingStrategies).map(samplingStrategyCodeToItem)]

  const samplingDesing = Chain.getSamplingDesign(chain)
  const samplingStrategy = ChainSamplingDesign.getSamplingStrategy(samplingDesing)
  const selectedItem = samplingStrategy ? samplingStrategyCodeToItem(samplingStrategy) : emptyItem

  return (
    <FormItem label="chainView.samplingStrategyLabel">
      <Dropdown
        items={items}
        selection={selectedItem}
        onChange={(item) =>
          updateChain(Chain.updateSamplingDesign(ChainSamplingDesign.assocSamplingStrategy(item?.value))(chain))
        }
        disabled={!editable}
      />
    </FormItem>
  )
}

SamplingDesignStrategySelector.propTypes = {
  chain: PropTypes.object.isRequired,
  updateChain: PropTypes.func.isRequired,
}
```

- [ ] **Step 4: Disable `BaseUnitCodeAttributeSelector.js`**

This is the shared selector used by both `StratumAttributeSelector` and `FirstPhaseCommonAttributeSelector` — disabling it here covers both without touching either caller.

Current content of `webapp/views/App/views/Analysis/Chain/BaseUnitCodeAttributeSelector.js`:

```js
import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

export const BaseUnitCodeAttributeSelector = (props) => {
  const { allowEmptySelection, info, label, nodeDefFilter, onChange: onChangeProp, selectedNodeDefUuid } = props

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  // selectable attribute defs can be code attributes in base unit or its ancestors
  const selectableDefs = useMemo(() => {
    if (!baseUnitNodeDef) return []

    const result = []
    Survey.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDef) => {
      // search inside single entities
      const descendantDefs = Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef,
        includeAnalysis: true,
      })(survey)
      result.push(
        ...descendantDefs.filter(
          (descendantDef) =>
            // only code attributes
            NodeDef.isCode(descendantDef) &&
            // avoid duplicates
            !result.some(NodeDef.isEqual(descendantDef)) &&
            (!nodeDefFilter || nodeDefFilter(descendantDef))
        )
      )
    })(survey)

    return result
  }, [baseUnitNodeDef, nodeDefFilter, survey])

  const onChange = useCallback((item) => onChangeProp(item?.value), [onChangeProp])

  const emptySelectionItem = { value: null, label: i18n.t('common.notSpecified') }
  const selectableItems = [...(allowEmptySelection ? [emptySelectionItem] : []), ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDef = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey) : null
  const selectedItem = selectedNodeDef ? nodeDefToItem(selectedNodeDef) : emptySelectionItem

  return (
    <FormItem label={label} info={info}>
      <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} />
    </FormItem>
  )
}

BaseUnitCodeAttributeSelector.propTypes = {
  allowEmptySelection: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string.isRequired,
  nodeDefFilter: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  selectedNodeDefUuid: PropTypes.string,
}
```

Replace the `useChain` import line and the returned `Dropdown` element:

```js
import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain, useChainEditable } from '@webapp/store/ui/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

const nodeDefToItem = (nodeDef) => ({
  value: NodeDef.getUuid(nodeDef),
  label: NodeDef.getLabel(nodeDef, null, NodeDef.NodeDefLabelTypes.name),
})

export const BaseUnitCodeAttributeSelector = (props) => {
  const { allowEmptySelection, info, label, nodeDefFilter, onChange: onChangeProp, selectedNodeDefUuid } = props

  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  // selectable attribute defs can be code attributes in base unit or its ancestors
  const selectableDefs = useMemo(() => {
    if (!baseUnitNodeDef) return []

    const result = []
    Survey.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDef) => {
      // search inside single entities
      const descendantDefs = Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef,
        includeAnalysis: true,
      })(survey)
      result.push(
        ...descendantDefs.filter(
          (descendantDef) =>
            // only code attributes
            NodeDef.isCode(descendantDef) &&
            // avoid duplicates
            !result.some(NodeDef.isEqual(descendantDef)) &&
            (!nodeDefFilter || nodeDefFilter(descendantDef))
        )
      )
    })(survey)

    return result
  }, [baseUnitNodeDef, nodeDefFilter, survey])

  const onChange = useCallback((item) => onChangeProp(item?.value), [onChangeProp])

  const emptySelectionItem = { value: null, label: i18n.t('common.notSpecified') }
  const selectableItems = [...(allowEmptySelection ? [emptySelectionItem] : []), ...selectableDefs.map(nodeDefToItem)]

  const selectedNodeDef = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(survey) : null
  const selectedItem = selectedNodeDef ? nodeDefToItem(selectedNodeDef) : emptySelectionItem

  return (
    <FormItem label={label} info={info}>
      <Dropdown selection={selectedItem} items={selectableItems} onChange={onChange} disabled={!editable} />
    </FormItem>
  )
}

BaseUnitCodeAttributeSelector.propTypes = {
  allowEmptySelection: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string.isRequired,
  nodeDefFilter: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  selectedNodeDefUuid: PropTypes.string,
}
```

- [ ] **Step 5: Disable `FirstPhaseCategorySelector.js`**

Current content of `webapp/views/App/views/Analysis/Chain/FirstPhaseCategorySelector/FirstPhaseCategorySelector.js`:

```js
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import * as Category from '@core/survey/category'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'

export const FirstPhaseCategorySelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (category) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCategoryUuid(Category.getUuid(category))
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.firstPhaseCategory">
      <CategorySelector
        categoryUuid={ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)}
        onChange={onChange}
        showAdd={false}
        showEdit
        showManage={false}
      />
    </FormItem>
  )
}
```

Replace it with:

```js
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import * as Category from '@core/survey/category'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'

export const FirstPhaseCategorySelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (category) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCategoryUuid(Category.getUuid(category))
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.firstPhaseCategory">
      <CategorySelector
        categoryUuid={ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)}
        onChange={onChange}
        showAdd={false}
        showEdit={editable}
        showManage={false}
        disabled={!editable}
      />
    </FormItem>
  )
}
```

Note: `CategorySelector`'s own implementation only auto-hides its "add" affordance and gates `CategoryList.canSelect` when `disabled` is true (`webapp/components/survey/CategorySelector/CategorySelector.js:123,139`) — the "edit" pencil (`CategorySelector.js:119-121`) is gated solely on `showEdit && category`, with no `disabled` check. This was discovered during Task 3's review (an earlier version of this note incorrectly claimed the edit affordance auto-hid too). The fix is `showEdit={editable}` instead of a bare `showEdit`, shown above — this is how the "edit category" navigation gets blocked while locked, without us needing to touch the shared `CategoryDetails` page (see Global Constraints for why that page itself is out of scope).

- [ ] **Step 6: Disable `ClusteringEntitySelector.js`**

Current content of `webapp/views/App/views/Analysis/Chain/ClusteringEntitySelector.js`:

```js
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

export const ClusteringEntitySelector = () => {
  const dispatch = useDispatch()

  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hierarchy = Survey.getHierarchy(
    (nodeDef) =>
      NodeDef.isRoot(nodeDef) || (NodeDef.isMultipleEntity(nodeDef) && NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef))
  )(survey)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const selectedEntityUuid = ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign)

  const onChange = (entityDefUuid) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocClusteringNodeDefUuid(entityDefUuid === 'null' ? null : entityDefUuid)
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.clusteringEntity">
      <EntitySelector
        hierarchy={hierarchy}
        nodeDefUuidEntity={selectedEntityUuid}
        onChange={onChange}
        showSingleEntities={false}
        useNameAsLabel={true}
        allowEmptySelection={true}
      />
    </FormItem>
  )
}
```

Replace it with:

```js
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

export const ClusteringEntitySelector = () => {
  const dispatch = useDispatch()

  const chain = useChain()
  const editable = useChainEditable()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hierarchy = Survey.getHierarchy(
    (nodeDef) =>
      NodeDef.isRoot(nodeDef) || (NodeDef.isMultipleEntity(nodeDef) && NodeDef.isAncestorOf(baseUnitNodeDef)(nodeDef))
  )(survey)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const selectedEntityUuid = ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign)

  const onChange = (entityDefUuid) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocClusteringNodeDefUuid(entityDefUuid === 'null' ? null : entityDefUuid)
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.clusteringEntity">
      <EntitySelector
        hierarchy={hierarchy}
        nodeDefUuidEntity={selectedEntityUuid}
        onChange={onChange}
        showSingleEntities={false}
        useNameAsLabel={true}
        allowEmptySelection={true}
        disabled={!editable}
      />
    </FormItem>
  )
}
```

- [ ] **Step 7: Lint**

```bash
npx eslint --cache --fix webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js webapp/views/App/views/Analysis/Chain/BaseUnitSelector/BaseUnitSelector.js webapp/views/App/views/Analysis/Chain/SamplingDesignStrategySelector/SamplingDesignStrategySelector.js webapp/views/App/views/Analysis/Chain/BaseUnitCodeAttributeSelector.js webapp/views/App/views/Analysis/Chain/FirstPhaseCategorySelector/FirstPhaseCategorySelector.js webapp/views/App/views/Analysis/Chain/ClusteringEntitySelector.js
```

Expected: no errors.

- [ ] **Step 8: Manually verify in the browser**

Find (or temporarily create) a chain that has a base unit configured, so the "Sampling Design" tab is visible with its full set of selectors (base unit, sampling strategy, stratum/first-phase/clustering selectors depending on strategy, clustering-only-variances checkbox, non-response bias checkbox, reporting area input).

1. Reload the page, go to the "Sampling Design" tab, unlocked. Confirm all selectors/checkboxes/input are interactive.
2. Click "Lock".
3. Confirm every dropdown/selector/checkbox/input on this tab is now disabled (visually greyed out, unclickable) — base unit, sampling strategy, stratum attribute (if a stratified strategy is selected), first-phase category (if applicable), clustering entity, clustering-only-variances, non-response bias correction, reporting area.
4. Confirm the "edit" pencil icon next to the first-phase category selector (if shown) disappears while locked.
5. Click "Unlock". Confirm everything is interactive again.

- [ ] **Step 9: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/ChainSamplingDesignProps.js webapp/views/App/views/Analysis/Chain/BaseUnitSelector/BaseUnitSelector.js webapp/views/App/views/Analysis/Chain/SamplingDesignStrategySelector/SamplingDesignStrategySelector.js webapp/views/App/views/Analysis/Chain/BaseUnitCodeAttributeSelector.js webapp/views/App/views/Analysis/Chain/FirstPhaseCategorySelector/FirstPhaseCategorySelector.js webapp/views/App/views/Analysis/Chain/ClusteringEntitySelector.js
git commit -m "$(cat <<'EOF'
Make chain sampling design tab read-only when locked

EOF
)"
```

---

### Task 4: Make the analysis node defs tree read-only when locked

**Files:**
- Modify: `webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDefsHeader/AnalysisNodeDefsHeader.js`
- Modify: `webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDef/AnalysisNodeDef.js`

**Interfaces:**
- Consumes: `useChainEditable()` from `@webapp/store/ui/chain` (Task 1).

- [ ] **Step 1: Disable the "add" buttons in `AnalysisNodeDefsHeader.js`**

Current content of `webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDefsHeader/AnalysisNodeDefsHeader.js`:

```js
import './AnalysisNodeDefsHeader.scss'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { Button } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'

const AnalysisNodeDefsHeader = ({ toggleShowSamplingNodeDefs, showSamplingNodeDefs }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const chain = useChain()

  const createNodeDef = (type) => dispatch(ChainActions.createNodeDef({ navigate, type }))

  return (
    <div className="analysis-node-defs-header">
      <div className="analysis-node-defs-header__buttons_container">
        {Chain.hasSamplingDesign(chain) && (
          <Checkbox
            checked={showSamplingNodeDefs}
            label="chainView.showSamplingAttributes"
            onChange={toggleShowSamplingNodeDefs}
          />
        )}
        <div className="analysis-node-defs-header__buttons">
          <Button
            iconClassName="icon-plus"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.decimal)}
            label="common:chain.addQuantitative"
            onClick={() => createNodeDef(NodeDef.nodeDefType.decimal)}
          />
          <Button
            iconClassName="icon-plus"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.code)}
            label="common:chain.addCategorical"
            onClick={() => createNodeDef(NodeDef.nodeDefType.code)}
          />
        </div>
      </div>
    </div>
  )
}

export { AnalysisNodeDefsHeader }
```

Replace it with:

```js
import './AnalysisNodeDefsHeader.scss'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { Button } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'

const AnalysisNodeDefsHeader = ({ toggleShowSamplingNodeDefs, showSamplingNodeDefs }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const chain = useChain()
  const editable = useChainEditable()

  const createNodeDef = (type) => dispatch(ChainActions.createNodeDef({ navigate, type }))

  return (
    <div className="analysis-node-defs-header">
      <div className="analysis-node-defs-header__buttons_container">
        {Chain.hasSamplingDesign(chain) && (
          <Checkbox
            checked={showSamplingNodeDefs}
            label="chainView.showSamplingAttributes"
            onChange={toggleShowSamplingNodeDefs}
          />
        )}
        <div className="analysis-node-defs-header__buttons">
          <Button
            iconClassName="icon-plus"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.decimal)}
            label="common:chain.addQuantitative"
            onClick={() => createNodeDef(NodeDef.nodeDefType.decimal)}
            disabled={!editable}
          />
          <Button
            iconClassName="icon-plus"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.code)}
            label="common:chain.addCategorical"
            onClick={() => createNodeDef(NodeDef.nodeDefType.code)}
            disabled={!editable}
          />
        </div>
      </div>
    </div>
  )
}

export { AnalysisNodeDefsHeader }
```

Note: the "show sampling attributes" `Checkbox` is intentionally left enabled — it's local UI state (`showSamplingNodeDefs`), not chain data (see Global Constraints).

- [ ] **Step 2: Disable the drag handle and active-toggle in `AnalysisNodeDef.js`**

Current content of `webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDef/AnalysisNodeDef.js`:

```js
import './AnalysisNodeDef.scss'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { useSurvey, NodeDefsActions, useSurveyPreferredLang, useSurveyCycleKey } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

import InputSwitch from '@webapp/components/form/InputSwitch'
import WarningBadge from '@webapp/components/warningBadge'

const AnalysisNodeDef = ({ nodeDefUuid, dataCount = undefined }) => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefDeleted = !nodeDef
  const parentEntity = Survey.getNodeDefParent(nodeDef)(survey)
  const parentEntityName = NodeDef.getName(parentEntity)
  const parentEntityNotInCurrentCycle = !NodeDef.isInCycle(cycle)(parentEntity)
  const noData = dataCount === 0
  const warningShown = noData || parentEntityNotInCurrentCycle

  const handleSetActive = useCallback(() => {
    const active = NodeDef.isActive(nodeDef)
    const newNodeDef = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.active, value: !active })(nodeDef)

    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        parentUuid: NodeDef.getParentUuid(nodeDef),
        propsAdvanced: {
          [NodeDef.keysPropsAdvanced.active]: !active,
        },
      })
    )

    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: newNodeDef }))
  }, [nodeDef])

  return (
    <div className={classNames('analysis-node-def', { deleted: nodeDefDeleted })}>
      <div>
        <button className="analysis-node-def__btn-move" type="button">
          <span className="icon icon-menu" />
        </button>
      </div>
      <div className={classNames('analysis-node-def__entity-name', { 'with-warning': warningShown })}>
        <span className="entity-label" title={parentEntityName}>
          {parentEntityName}
        </span>
        {noData && <WarningBadge title="chain.entityWithoutData" titleParams={{ name: parentEntityName }} />}
        {!noData && parentEntityNotInCurrentCycle && (
          <WarningBadge title="chain.entityNotInCurrentCycle" titleParams={{ name: parentEntityName }} />
        )}
      </div>
      <div>{NodeDef.getName(nodeDef)}</div>
      <div>{NodeDef.getLabel(nodeDef, lang)}</div>
      <div className="analysis-node-def__area-based">
        {NodeDef.isDecimal(nodeDef) && NodeDef.hasAreaBasedEstimated(nodeDef) && (
          <span className="icon icon-checkmark" />
        )}
      </div>
      <div className="analysis-node-def__type">
        {i18n.t(nodeDefType === NodeDef.nodeDefType.decimal ? 'chain.quantitative' : 'chain.categorical')}
      </div>
      <div>
        <InputSwitch
          checked={!nodeDefDeleted && NodeDef.isActive(nodeDef)}
          disabled={nodeDefDeleted || NodeDef.isSampling(nodeDef)}
          onChange={handleSetActive}
        />
      </div>
      <div>
        <Link
          className="btn btn-xs btn-transparent"
          to={`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
        >
          <span className="icon icon-pencil2 icon-10px icon-left" />
          {i18n.t('common.edit')}
        </Link>
      </div>
    </div>
  )
}

AnalysisNodeDef.propTypes = {
  nodeDefUuid: PropTypes.string.isRequired,
  dataCount: PropTypes.number,
}

export { AnalysisNodeDef }
```

Replace it with:

```js
import './AnalysisNodeDef.scss'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { useSurvey, NodeDefsActions, useSurveyPreferredLang, useSurveyCycleKey } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useChainEditable } from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

import InputSwitch from '@webapp/components/form/InputSwitch'
import WarningBadge from '@webapp/components/warningBadge'

const AnalysisNodeDef = ({ nodeDefUuid, dataCount = undefined }) => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const editable = useChainEditable()

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefDeleted = !nodeDef
  const parentEntity = Survey.getNodeDefParent(nodeDef)(survey)
  const parentEntityName = NodeDef.getName(parentEntity)
  const parentEntityNotInCurrentCycle = !NodeDef.isInCycle(cycle)(parentEntity)
  const noData = dataCount === 0
  const warningShown = noData || parentEntityNotInCurrentCycle

  const handleSetActive = useCallback(() => {
    const active = NodeDef.isActive(nodeDef)
    const newNodeDef = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.active, value: !active })(nodeDef)

    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        parentUuid: NodeDef.getParentUuid(nodeDef),
        propsAdvanced: {
          [NodeDef.keysPropsAdvanced.active]: !active,
        },
      })
    )

    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: newNodeDef }))
  }, [nodeDef])

  return (
    <div className={classNames('analysis-node-def', { deleted: nodeDefDeleted })}>
      <div>
        <button className="analysis-node-def__btn-move" type="button" disabled={!editable}>
          <span className="icon icon-menu" />
        </button>
      </div>
      <div className={classNames('analysis-node-def__entity-name', { 'with-warning': warningShown })}>
        <span className="entity-label" title={parentEntityName}>
          {parentEntityName}
        </span>
        {noData && <WarningBadge title="chain.entityWithoutData" titleParams={{ name: parentEntityName }} />}
        {!noData && parentEntityNotInCurrentCycle && (
          <WarningBadge title="chain.entityNotInCurrentCycle" titleParams={{ name: parentEntityName }} />
        )}
      </div>
      <div>{NodeDef.getName(nodeDef)}</div>
      <div>{NodeDef.getLabel(nodeDef, lang)}</div>
      <div className="analysis-node-def__area-based">
        {NodeDef.isDecimal(nodeDef) && NodeDef.hasAreaBasedEstimated(nodeDef) && (
          <span className="icon icon-checkmark" />
        )}
      </div>
      <div className="analysis-node-def__type">
        {i18n.t(nodeDefType === NodeDef.nodeDefType.decimal ? 'chain.quantitative' : 'chain.categorical')}
      </div>
      <div>
        <InputSwitch
          checked={!nodeDefDeleted && NodeDef.isActive(nodeDef)}
          disabled={nodeDefDeleted || NodeDef.isSampling(nodeDef) || !editable}
          onChange={handleSetActive}
        />
      </div>
      <div>
        <Link
          className="btn btn-xs btn-transparent"
          to={`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
        >
          <span className="icon icon-pencil2 icon-10px icon-left" />
          {i18n.t('common.edit')}
        </Link>
      </div>
    </div>
  )
}

AnalysisNodeDef.propTypes = {
  nodeDefUuid: PropTypes.string.isRequired,
  dataCount: PropTypes.number,
}

export { AnalysisNodeDef }
```

Note: the "Edit" link is intentionally left as-is (still navigable) — see Task 5, which makes its destination read-only instead of blocking navigation to it.

- [ ] **Step 3: Lint**

```bash
npx eslint --cache --fix webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDefsHeader/AnalysisNodeDefsHeader.js webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDef/AnalysisNodeDef.js
```

Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

On a chain that has at least one analysis node def (quantitative or categorical result attribute) in its tree:

1. Reload the page, unlocked. Confirm "Add quantitative"/"Add categorical" buttons are clickable, the drag-handle (hamburger icon) is grabbable, and the active toggle switch is clickable for each row.
2. Click "Lock".
3. Confirm the two "Add" buttons are now disabled.
4. Confirm dragging a row by its handle no longer works (try to drag — it should not move).
5. Confirm the active toggle switch on each row is disabled (unless the row was already forced-disabled for other reasons, e.g. a sampling node def).
6. Confirm the "Edit" link on a row is still clickable (it should still navigate — verified fully in Task 5).
7. Click "Unlock". Confirm everything is interactive again.

- [ ] **Step 5: Commit**

```bash
git add webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDefsHeader/AnalysisNodeDefsHeader.js webapp/views/App/views/Analysis/Chain/AnalysisNodeDefs/AnalysisNodeDef/AnalysisNodeDef.js
git commit -m "$(cat <<'EOF'
Make analysis node defs tree read-only when locked

EOF
)"
```

---

### Task 5: Wrap the node-def formula editor read-only when the chain is locked

**Files:**
- Create: `webapp/views/App/views/Analysis/ChainNodeDefDetails/ChainNodeDefDetails.js`
- Create: `webapp/views/App/views/Analysis/ChainNodeDefDetails/ChainNodeDefDetails.scss`
- Create: `webapp/views/App/views/Analysis/ChainNodeDefDetails/index.js`
- Modify: `webapp/views/App/views/Analysis/Analysis.js`

**Interfaces:**
- Consumes: `useChainEditable()` from `@webapp/store/ui/chain` (Task 1).
- Consumes: `NodeDefDetails` default export from `@webapp/components/survey/NodeDefDetails` (unmodified — reads `nodeDefUuid` from the route via its own internal `useParams()` call, so no props need to be forwarded).

- [ ] **Step 1: Create the wrapper component**

Create `webapp/views/App/views/Analysis/ChainNodeDefDetails/ChainNodeDefDetails.js`:

```js
import './ChainNodeDefDetails.scss'

import React from 'react'
import classNames from 'classnames'

import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import { useChainEditable } from '@webapp/store/ui/chain'

const ChainNodeDefDetails = () => {
  const editable = useChainEditable()

  return (
    <div className={classNames('chain-node-def-details', { 'chain-node-def-details--locked': !editable })}>
      <NodeDefDetails />
    </div>
  )
}

export default ChainNodeDefDetails
```

- [ ] **Step 2: Create the stylesheet**

Create `webapp/views/App/views/Analysis/ChainNodeDefDetails/ChainNodeDefDetails.scss`:

```scss
.chain-node-def-details--locked {
  pointer-events: none;
  opacity: 0.6;
}
```

- [ ] **Step 3: Create the barrel export**

Create `webapp/views/App/views/Analysis/ChainNodeDefDetails/index.js`:

```js
export { default } from './ChainNodeDefDetails'
```

- [ ] **Step 4: Wire the wrapper into the Analysis module route**

Current content of `webapp/views/App/views/Analysis/Analysis.js`:

```js
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'

import { appModules, appModuleUri, analysisModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'
import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import Chains from './Chains'
import Chain from './Chain'
import Instances from './Instances'
import { useSurveyInfo } from '@webapp/store/survey'
// import Entities from './Entities'

const Analysis = () => {
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  return (
    <SurveyDefsLoader draft onSurveyCycleUpdate={() => navigate(appModuleUri(analysisModules.chains))}>
      <ModuleSwitch
        moduleRoot={appModules.analysis}
        moduleDefault={analysisModules.chains}
        modules={[
          {
            component: Chains,
            path: analysisModules.chains.path,
          },
          {
            component: Chain,
            path: analysisModules.chain.path,
          },
          {
            component: Chain,
            path: `${analysisModules.chain.path}/:chainUuid/`,
          },
          // {
          //   component: Entities,
          //   path: appModuleUri(analysisModules.entities),
          // },
          {
            component: NodeDefDetails,
            path: `${analysisModules.nodeDef.path}/:nodeDefUuid/`,
          },
          {
            component: CategoryDetails,
            path: `${analysisModules.category.path}/:categoryUuid`,
            props: { analysis: true },
          },

          ...(Survey.isPublished(surveyInfo)
            ? [
                {
                  component: Instances,
                  path: analysisModules.instances.path,
                },
              ]
            : []),
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Analysis
```

Replace it with:

```js
import { useNavigate } from 'react-router'

import * as Survey from '@core/survey/survey'

import { appModules, appModuleUri, analysisModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import Chains from './Chains'
import Chain from './Chain'
import ChainNodeDefDetails from './ChainNodeDefDetails'
import Instances from './Instances'
import { useSurveyInfo } from '@webapp/store/survey'
// import Entities from './Entities'

const Analysis = () => {
  const navigate = useNavigate()
  const surveyInfo = useSurveyInfo()
  return (
    <SurveyDefsLoader draft onSurveyCycleUpdate={() => navigate(appModuleUri(analysisModules.chains))}>
      <ModuleSwitch
        moduleRoot={appModules.analysis}
        moduleDefault={analysisModules.chains}
        modules={[
          {
            component: Chains,
            path: analysisModules.chains.path,
          },
          {
            component: Chain,
            path: analysisModules.chain.path,
          },
          {
            component: Chain,
            path: `${analysisModules.chain.path}/:chainUuid/`,
          },
          // {
          //   component: Entities,
          //   path: appModuleUri(analysisModules.entities),
          // },
          {
            component: ChainNodeDefDetails,
            path: `${analysisModules.nodeDef.path}/:nodeDefUuid/`,
          },
          {
            component: CategoryDetails,
            path: `${analysisModules.category.path}/:categoryUuid`,
            props: { analysis: true },
          },

          ...(Survey.isPublished(surveyInfo)
            ? [
                {
                  component: Instances,
                  path: analysisModules.instances.path,
                },
              ]
            : []),
        ]}
      />
    </SurveyDefsLoader>
  )
}

export default Analysis
```

- [ ] **Step 5: Lint**

```bash
npx eslint --cache --fix webapp/views/App/views/Analysis/ChainNodeDefDetails/ChainNodeDefDetails.js webapp/views/App/views/Analysis/ChainNodeDefDetails/index.js webapp/views/App/views/Analysis/Analysis.js
```

Expected: no errors.

- [ ] **Step 6: Manually verify in the browser**

On a chain that has at least one analysis node def:

1. Reload the page, unlocked. Click "Edit" on an analysis node def row — confirm the formula editor page opens and its fields (name, expression, validations, etc.) are normally editable.
2. Navigate back to the chain, click "Lock".
3. Click "Edit" on an analysis node def row again — confirm the formula editor page still opens (navigation is not blocked), but now appears dimmed and none of its inputs/buttons respond to clicks.
4. Navigate back to the chain (browser back or the chain link), click "Unlock", then "Edit" again — confirm the formula editor is fully interactive again.
5. Separately, open the Survey Designer (not via Analysis) and edit a normal (non-analysis) attribute definition — confirm this is completely unaffected (the wrapper only applies to the Analysis-module route).

- [ ] **Step 7: Commit**

```bash
git add webapp/views/App/views/Analysis/ChainNodeDefDetails webapp/views/App/views/Analysis/Analysis.js
git commit -m "$(cat <<'EOF'
Wrap analysis node-def formula editor read-only when chain is locked

EOF
)"
```

---

## Self-Review Notes

**Spec coverage:**
- Redux state (`chainEditLocked`, `toggleEditLock`, `useChainEditable`) → Task 1.
- Lock button in ButtonBar + i18n → Task 1.
- `ChainBasicProps`, `ChainRStudioFieldset` → Task 2.
- `ChainSamplingDesignProps` + all 6 selector components (`BaseUnitSelector`, `SamplingDesignStrategySelector`, `StratumAttributeSelector` via `BaseUnitCodeAttributeSelector`, `FirstPhaseCategorySelector`, `FirstPhaseCommonAttributeSelector` via `BaseUnitCodeAttributeSelector`, `ClusteringEntitySelector`) → Task 3.
- `AnalysisNodeDefsHeader`, `AnalysisNodeDef` → Task 4.
- `ButtonBar`'s Delete button disabling → Task 1, Step 8.
- Download button / sampling-checkbox / RStudio launch buttons staying enabled → explicitly called out in Tasks 1, 2, 4.
- Node-def formula editor wrapper → Task 5.
- StatisticalAnalysis exclusion (dead code) and CategoryDetails exclusion (shared survey-wide resource) → documented in Global Constraints, not implemented (correctly — nothing to build).

**Placeholder scan:** no TBD/TODO; every step shows complete before/after code.

**Type consistency:** `useChainEditable()` returns a boolean everywhere it's consumed; `ChainActions.toggleEditLock` is dispatched the same way (`dispatch(ChainActions.toggleEditLock)`) in its only call site (Task 1); `disabled`/`readOnly` prop names match what each underlying component actually declares (verified per-component: `Checkbox`/`Dropdown`/`EntitySelector`/`CategorySelector`/`RecordsDropdown`/`ButtonRStudio`/`Button`/`ButtonDelete`/`InputSwitch` all use `disabled`; `LabelsEditor`/`Input` use `readOnly`/`disabled` respectively as shown).

## Post-implementation note

Task 5's `ChainNodeDefDetails.js` was written as plain `.js` to match its sibling files in `webapp/views/App/views/Analysis/` (all `.js`). Per the user's standing preference that new webapp React components be `.tsx`, it was converted to `ChainNodeDefDetails.tsx` immediately after Task 5's review (no logic change — same content, `.js` → `.tsx` extension only; `tsconfig.json` has `allowJs`/`checkJs: false`/`strict: false`, so no typing changes were needed).
