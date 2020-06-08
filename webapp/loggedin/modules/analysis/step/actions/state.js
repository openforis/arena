import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { DialogConfirmActions } from '@webapp/store/ui'
import { SurveyState, NodeDefsActions } from '@webapp/store/survey'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/chain/actions'

export const stepReset = 'analysis/step/reset'
export const stepUpdate = 'analysis/step/update'
export const calculationUpdate = 'analysis/calculation/update'

export const resetStep = () => (dispatch) => dispatch({ type: stepReset })

export const setCalculationForEdit = (calculation) => (dispatch) => dispatch({ type: calculationUpdate, calculation })

export const setStepForEdit = (processingStep) => (dispatch, getState) => {
  const stepUpdateAction = { type: stepUpdate, processingStep }

  const state = getState()
  if (StepState.isDirty(state) || CalculationState.isDirty(state)) {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'common.cancelConfirm',
        onOk: async () => {
          await dispatch(resetStep())
          dispatch(stepUpdateAction)
        },
      })
    )
  } else {
    dispatch(stepUpdateAction)
  }
}

// ====== VIRTUAL ENTITY
export const addEntityVirtual = (history) => async (dispatch, getState) => {
  const state = getState()
  const surveyInfo = SurveyState.getSurveyInfo(state)

  const nodeDef = NodeDef.newNodeDef(
    null,
    NodeDef.nodeDefType.entity,
    Survey.getCycleKeys(surveyInfo),
    { [NodeDef.propKeys.multiple]: true },
    {},
    true,
    true
  )

  await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })

  dispatch(navigateToNodeDefEdit(history, NodeDef.getUuid(nodeDef)))
}
