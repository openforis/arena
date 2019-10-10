import { combineReducers } from 'redux'

import processingChain from './processingChain/reducer'

import * as ProcessingChainViewState from './processingChain/processingChainViewState'

export default combineReducers({
  [ProcessingChainViewState.stateKey]: processingChain,
})