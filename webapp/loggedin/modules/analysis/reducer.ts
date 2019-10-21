import { combineReducers } from 'redux'

import processingChain from './processingChain/reducer'

import * as ProcessingChainState from './processingChain/processingChainState'

export default combineReducers({
  [ProcessingChainState.stateKey]: processingChain,
})
