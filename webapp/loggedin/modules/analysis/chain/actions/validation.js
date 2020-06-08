import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import { SurveyState } from '@webapp/store/survey'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

export const chainValidationUpdate = 'analysis/chain/validation/update'

export const validateChain = () => async (dispatch, getState) => {
  const state = getState()
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const chain = ChainState.getProcessingChain(state)
  const validation = await ChainValidator.validateChain(chain, Survey.getDefaultLanguage(surveyInfo))
  const chainUpdated = Chain.assocItemValidation(Chain.getUuid(chain), validation)(chain)

  dispatch({ type: chainValidationUpdate, validation: Chain.getValidation(chainUpdated) })
}
