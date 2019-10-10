import { exportReducer } from '../../../../utils/reduxUtils'

import {
  processingChainUpdate,
  processingChainPropUpdate,
} from './actions'

import { appUserLogout } from '../../../../app/actions'

import * as ProcessingChainState from './processingChainState'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../../survey/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [processingChainUpdate]: (state, { processingChain }) => ProcessingChainState.assocProcessingChain(processingChain)(state),
  [processingChainPropUpdate]: (state, { key, value }) => ProcessingChainState.assocProcessingChainProp(key, value)(state),
}

export default exportReducer(actionHandlers)