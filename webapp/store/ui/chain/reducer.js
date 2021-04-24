import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  entityDefUuid: null,
  chainNodeDefs: [],
}

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [ChainActionTypes.chainUpdate]: (state, { chain }) => ({ ...state, chain }),

  [ChainActionTypes.entityDefUuidUpdate]: (state, { entityDefUuid }) => ({ ...state, entityDefUuid }),

  [ChainActionTypes.chainNodeDefsUpdate]: (state, { chainNodeDefs }) => ({ ...state, chainNodeDefs }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
