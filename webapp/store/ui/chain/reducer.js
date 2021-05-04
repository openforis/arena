import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  entityDefUuid: null,
  chainNodeDefs: [],
  chainNodeDefsCount: {},
}

const reset = () => initialState

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: reset,

  [SurveyActions.surveyCreate]: reset,
  [SurveyActions.surveyUpdate]: reset,
  [SurveyActions.surveyDelete]: reset,

  [ChainActionTypes.chainReset]: reset,

  [ChainActionTypes.chainUpdate]: (state, { chain, chainNodeDefsCount = null }) => ({
    ...state,
    chain,
    chainNodeDefsCount: chainNodeDefsCount || state.chainNodeDefsCount,
  }),

  [ChainActionTypes.entityDefUuidUpdate]: (state, { entityDefUuid }) => ({ ...state, entityDefUuid }),

  [ChainActionTypes.chainNodeDefsUpdate]: (state, { chainNodeDefs }) => ({ ...state, chainNodeDefs }),

  [ChainActionTypes.chainNodeDefUpdate]: (state, { chainNodeDef }) => {
    const { chainNodeDefs } = state
    chainNodeDefs[chainNodeDef.index] = chainNodeDef
    return {
      ...state,
      chainNodeDefs: [...chainNodeDefs],
    }
  },
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
