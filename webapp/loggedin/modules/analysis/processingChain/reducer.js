import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  processingChainReset,
  processingChainUpdate,
  processingChainPropUpdate,
  processingChainStepsLoad,
  processingChainSave,
  processingChainValidationUpdate,
} from '@webapp/loggedin/modules/analysis/processingChain/actions'
import {
  processingStepCreate,
  processingStepReset,
  processingStepDelete,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'
import {
  processingStepCalculationDirtyUpdate,
  processingStepCalculationDelete,
  processingStepCalculationReset,
} from '../processingStepCalculation/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Chain
  [processingChainReset]: () => ({}),

  [processingChainUpdate]: (state, { processingChain, attributeUuidsOtherChains }) =>
    ProcessingChainState.initProcessingChain(processingChain, attributeUuidsOtherChains)(state),

  [processingChainPropUpdate]: (state, { key, value }) => ProcessingChainState.assocPropDirty(key, value)(state),

  [processingChainSave]: (state, { chain, step }) => ProcessingChainState.saveDirty(chain, step)(state),

  [processingChainValidationUpdate]: (state, { validation }) =>
    ProcessingChainState.assocProcessingChainValidation(validation)(state),

  // Steps
  [processingChainStepsLoad]: (state, { processingSteps }) =>
    ProcessingChainState.assocProcessingSteps(processingSteps)(state),

  [processingStepCreate]: (state, { processingStep }) =>
    ProcessingChainState.appendProcessingStep(processingStep)(state),

  [processingStepReset]: (state) => ProcessingChainState.dissocStepTemporary(state),

  [processingStepDelete]: (state) => ProcessingChainState.dissocStepLast(state),

  // Calculations
  [processingStepCalculationDirtyUpdate]: (state, { calculation }) =>
    ProcessingChainState.assocProcessingStepCalculationAttributeUuid(
      ProcessingStepCalculation.getUuid(calculation),
      ProcessingStepCalculation.getNodeDefUuid(calculation)
    )(state),

  [processingStepCalculationDelete]: (state, { calculation }) =>
    ProcessingChainState.dissocProcessingStepCalculationAttributeUuid(ProcessingStepCalculation.getUuid(calculation))(
      state
    ),

  [processingStepCalculationReset]: (state, { calculation }) =>
    R.ifElse(
      R.always(ProcessingStepCalculation.isTemporary(calculation)),
      ProcessingChainState.dissocProcessingStepCalculationAttributeUuid(ProcessingStepCalculation.getUuid(calculation)),
      ProcessingChainState.resetProcessingStepCalculationAttributeUuid(ProcessingStepCalculation.getUuid(calculation))
    )(state),
}

export default exportReducer(actionHandlers)
