import { SystemActions } from '@webapp/store/system'
import { SurveyActions } from '@webapp/store/survey'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { ChainActionTypes } from './actions'

const initialState = {
  chain: null,
  entityDefUuid: null,
  chainNodeDefs: [],
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

  [ChainActionTypes.chainNodeDefUpdateIndex]: (state, { chainNodeDef, newIndex }) => {
    const { chainNodeDefs } = state
    const { index: oldIndex } = chainNodeDef
    const chainNodeDefsUpdate = []

    chainNodeDefs.forEach((chainNodeDefCurrent) => {
      const { index } = chainNodeDefCurrent
      let indexUpdate
      if (index > oldIndex && index <= newIndex) indexUpdate = index - 1
      else if (index < oldIndex && index >= newIndex) indexUpdate = index + 1
      else if (index === oldIndex) indexUpdate = newIndex
      else indexUpdate = index

      chainNodeDefsUpdate[indexUpdate] = { ...chainNodeDefCurrent, index: indexUpdate }
    })

    return {
      ...state,
      chainNodeDefs: [...chainNodeDefsUpdate],
    }
  },
}

export const ChainReducer = exportReducer(actionHandlers, initialState)
