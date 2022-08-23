import * as RecordStep from '@core/record/recordStep'

import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  recordsCountByStep: RecordStep.steps.reduce((acc, { id }) => ({ ...acc, [id]: '...' }), {}),
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

  [ChainActionTypes.chainRecordsCountUpdate]: (state, { recordsCountByStep }) => ({
    ...state,
    recordsCountByStep,
  }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
