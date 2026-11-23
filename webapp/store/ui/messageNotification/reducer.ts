import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { exportReducer } from '@webapp/utils/reduxUtils'

import { MessageNotificationActionTypes } from './actions'

const initialState = {
  messages: [],
}

const reset = () => initialState

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: reset,

  [MessageNotificationActionTypes.SET_MESSAGES]: (state, action) => ({
    ...state,
    messages: action.messages,
  }),
}

export const MessageNotificationReducer = exportReducer(actionHandlers, initialState)
