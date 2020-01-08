import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingStepCalculationState from './processingStepCalculationState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { processingStepCalculationEditCancel } from '@webapp/loggedin/modules/analysis/processingStep/actions'

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
  const calculation = ProcessingStepCalculationState.getCalculation(getState())
  const processingStep = ProcessingStepState

  /*
  If (ProcessingStepCalculation.isTemporary(calculation)) {
    Const { data: calculationInserted } = await axios.post(
      `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}/calculation`,
      calculation,
    )
  } else {
  }
  */
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
