import axios from 'axios'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepCalculationState from './processingStepCalculationState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import {
  processingStepCalculationEditCancel,
  processingStepCalculationForEditUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'
import { showAppLoader, hideAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

export const processingStepCalculationUpdate = 'analysis/processingStep/calculation/update'

export const updateProcessingStepCalculationProp = (prop, value) => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())

  const calculationUpdated = ProcessingStepCalculation.assocProp(prop, value)(calculation)

  dispatch({
    type: processingStepCalculationUpdate,
    calculation: calculationUpdated,
  })
}

export const updateProcessingStepCalculationAttribute = attrDefUuid => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())

  const calculationUpdated = ProcessingStepCalculation.assocNodeDefUuid(attrDefUuid)(calculation)

  dispatch({
    type: processingStepCalculationUpdate,
    calculation: calculationUpdated,
  })
}

export const saveProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculationParam = ProcessingStepCalculationState.getCalculation(state)

  const updateFn = ProcessingStepCalculation.isTemporary(calculationParam) ? axios.post : axios.put
  const { data: calculation } = await updateFn(
    `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}/calculation`,
    ProcessingStepCalculation.dissocTemporary(calculationParam),
  )
  await dispatch({
    type: processingStepCalculationForEditUpdate,
    calculation,
  })
  dispatch(hideAppLoader())
  dispatch(showNotification('common.saved', {}, null, 3000))
}

export const cancelProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  // Restore original calculation
  await dispatch({
    type: processingStepCalculationUpdate,
    calculation: ProcessingStepCalculationState.getCalculationOriginal(getState()),
  })

  // Close editor
  dispatch({
    type: processingStepCalculationEditCancel,
  })
}
