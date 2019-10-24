import { exportReducer } from '@webapp/utils/reduxUtils'

import ProcessingChain from '@common/analysis/processingChain'

import {
  processingChainUpdate,
  processingChainPropUpdate,
} from './actions'

import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'

const actionHandlers = {
  // reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [processingChainUpdate]: (state, { processingChain }) => processingChain,
  [processingChainPropUpdate]: (state, { key, value }) => ProcessingChain.assocProp(key, value)(state),
}

export default exportReducer(actionHandlers)