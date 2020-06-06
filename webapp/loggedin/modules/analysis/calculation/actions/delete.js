import axios from 'axios'

import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { SurveyState } from '@webapp/store/survey'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

export const calculationDelete = 'analysis/calculation/delete'

export const deleteCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const step = StepState.getProcessingStep(state)
  const calculation = CalculationState.getCalculation(state)

  await axios.delete(
    `/api/survey/${surveyId}/processing-step/${Step.getUuid(step)}/calculation/${Calculation.getUuid(calculation)}`
  )

  dispatch({ type: calculationDelete, calculation })
  dispatch(showNotification('common.deleted', {}, null, 3000))
  dispatch(hideAppLoader())
}
