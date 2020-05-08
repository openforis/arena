import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  chainReset,
  chainUpdate,
  chainPropUpdate,
  chainSave,
  chainValidationUpdate,
} from '@webapp/loggedin/modules/analysis/chain/actions'

import { stepCreate, stepReset, stepDelete } from '@webapp/loggedin/modules/analysis/step/actions'

import {
  calculationDirtyUpdate,
  calculationDelete,
  calculationReset,
} from '@webapp/loggedin/modules/analysis/calculation/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Chain
  [chainReset]: () => ({}),

  [chainUpdate]: (state, { processingChain, attributeUuidsOtherChains }) =>
    ChainState.initProcessingChain(processingChain, attributeUuidsOtherChains)(state),

  [chainPropUpdate]: (state, { key, value }) => ChainState.assocPropDirty(key, value)(state),

  [chainSave]: (state, { chain, step }) => ChainState.saveDirty(chain, step)(state),

  [chainValidationUpdate]: (state, { validation }) => ChainState.assocProcessingChainValidation(validation)(state),

  // Steps
  [stepCreate]: (state, { processingStep }) => ChainState.appendProcessingStep(processingStep)(state),

  [stepReset]: (state) => ChainState.dissocStepTemporary(state),

  [stepDelete]: (state) => ChainState.dissocStepLast(state),

  // Calculations
  [calculationDirtyUpdate]: (state, { calculation }) =>
    ChainState.assocProcessingStepCalculationAttributeUuid(
      ProcessingStepCalculation.getUuid(calculation),
      ProcessingStepCalculation.getNodeDefUuid(calculation)
    )(state),

  [calculationDelete]: (state, { calculation }) =>
    ChainState.dissocProcessingStepCalculationAttributeUuid(ProcessingStepCalculation.getUuid(calculation))(state),

  [calculationReset]: (state, { calculation }) =>
    R.ifElse(
      R.always(ProcessingStepCalculation.isTemporary(calculation)),
      ChainState.dissocProcessingStepCalculationAttributeUuid(ProcessingStepCalculation.getUuid(calculation)),
      ChainState.resetProcessingStepCalculationAttributeUuid(ProcessingStepCalculation.getUuid(calculation))
    )(state),
}

export default exportReducer(actionHandlers)
