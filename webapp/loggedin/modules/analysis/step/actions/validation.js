import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { chainValidationUpdate } from '@webapp/loggedin/modules/analysis/chain/actions'

export const validateStep = () => async (dispatch, getState) => {
  // Validate step and update validation in chain
  const state = getState()
  const chain = ChainState.getProcessingChain(state)
  const step = StepState.getProcessingStep(state)
  const stepValidation = await ChainValidator.validateStep(step)
  const chainUpdated = Chain.assocItemValidation(Step.getUuid(step), stepValidation)(chain)

  dispatch({ type: chainValidationUpdate, validation: Chain.getValidation(chainUpdated) })
}
