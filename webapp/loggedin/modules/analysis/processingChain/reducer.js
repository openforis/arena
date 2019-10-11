import { exportReducer } from '../../../../utils/reduxUtils'

import ProcessingChain from '../../../../../core/analysis/processingChain'

import {
  processingChainUpdate,
  processingChainPropUpdate,
} from './actions'

import { appUserLogout } from '../../../../app/actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '../../../../survey/actions'

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