import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingStepCalculationState from './processingStepCalculationState'

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
