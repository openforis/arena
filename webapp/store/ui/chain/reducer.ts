import * as RecordStep from '@core/record/recordStep'
import * as SurveyActionTypes from '@webapp/store/survey/actions/actionTypes'
import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  recordsCountByStep: RecordStep.steps.reduce((acc, { id }) => ({ ...acc, [id]: '...' }), {}),
  chainEditLocked: true,
}

const reset = () => initialState

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: reset,

  [SurveyActionTypes.surveyCreate]: reset,
  [SurveyActionTypes.surveyUpdate]: reset,
  [SurveyActionTypes.surveyDelete]: reset,

  [ChainActionTypes.chainReset]: reset,

  [ChainActionTypes.chainUpdate]: (state, { chain }) => ({
    ...state,
    chain,
  }),

  [ChainActionTypes.chainRecordsCountUpdate]: (state, { recordsCountByStep }) => ({
    ...state,
    recordsCountByStep,
  }),

  [ChainActionTypes.chainEditLock]: (state, { locked }) => ({
    ...state,
    chainEditLocked: locked,
  }),
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
