import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
}

const reset = () => initialState

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: reset,

  [SurveyActions.surveyCreate]: reset,
  [SurveyActions.surveyUpdate]: reset,
  [SurveyActions.surveyDelete]: reset,

  [ChainActionTypes.chainReset]: reset,

  [ChainActionTypes.chainUpdate]: (state, { chain }) => ({
    ...state,
    chain,
  }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
