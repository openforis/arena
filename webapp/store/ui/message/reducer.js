import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { MessageActionTypes } from './actions/actionTypes'

const initialState = {
  message: null,
}

const reset = () => initialState

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: reset,

  [MessageActionTypes.messageReset]: reset,

  [MessageActionTypes.messageUpdate]: (state, { message }) => ({
    ...state,
    message,
  }),
}

export const MessageReducer = exportReducer(actionHandlers, initialState)
