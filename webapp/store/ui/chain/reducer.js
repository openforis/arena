import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  entityDefUuid: null,
}

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [ChainActionTypes.chainUpdate]: (state, action) => ({
    ...state,
    chain: action.chain,
  }),

  [ChainActionTypes.entityDefUuidUpdate]: (state, action) => ({
    ...state,
    entityDefUuid: action.entityDefUuid,
  }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
