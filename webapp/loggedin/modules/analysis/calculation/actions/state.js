import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { SurveyState, NodeDefsActions } from '@webapp/store/survey'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/chain/actions'

export const calculationReset = 'analysis/calculation/reset'

export const resetCalculation = () => (dispatch, getState) => {
  const calculation = CalculationState.getCalculation(getState())
  dispatch({ type: calculationReset, calculation })
}

export const createNodeDefAnalysis = (history) => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const processingStep = StepState.getProcessingStep(state)
  const nodeDefParent = R.pipe(Step.getEntityUuid, (entityDefUuid) => Survey.getNodeDefByUuid(entityDefUuid)(survey))(
    processingStep
  )
  const calculation = CalculationState.getCalculation(state)
  const nodeDefType = Calculation.getNodeDefType(calculation)

  const nodeDef = NodeDef.newNodeDef(
    nodeDefParent,
    nodeDefType,
    R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey),
    {},
    {},
    true
  )

  await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })

  dispatch(navigateToNodeDefEdit(history, NodeDef.getUuid(nodeDef)))
}
