import { exportReducer } from '../../../../utils/reduxUtils'

import {
  processingChainUpdate,
  processingChainPropUpdate,
} from './actions'

import { appUserLogout } from '../../../../app/actions'

import * as ProcessingChainViewState from './processingChainViewState'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../../survey/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [processingChainUpdate]: (state, { processingChain }) => ProcessingChainViewState.assocProcessingChain(processingChain)(state),
  [processingChainPropUpdate]: (state, { key, value }) => ProcessingChainViewState.assocProcessingChainProp(key, value)(state),
}

export default exportReducer(actionHandlers)