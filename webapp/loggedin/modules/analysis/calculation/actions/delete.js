import axios from 'axios'

import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import * as SurveyState from '@webapp/survey/surveyState'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { onNodeDefsDelete } from '@webapp/survey/nodeDefs/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

export const calculationDelete = 'analysis/calculation/delete'

export const deleteCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = StepState.getProcessingStep(state)
  const calculation = CalculationState.getCalculation(state)

  const { data: nodeDefUnusedDeletedUuids = [] } = await axios.delete(
    `/api/survey/${surveyId}/processing-step/${Step.getUuid(processingStep)}/calculation/${Calculation.getUuid(
      calculation
    )}`
  )

  dispatch({ type: calculationDelete, calculation })
  // Dissoc deleted node def analysis
  dispatch(onNodeDefsDelete(nodeDefUnusedDeletedUuids))
  dispatch(showNotification('common.deleted', {}, null, 3000))
  dispatch(hideAppLoader())
}
