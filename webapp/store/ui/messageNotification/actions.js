import { Messages } from '@openforis/arena-core'

import * as API from '@webapp/service/api'
import * as UserState from '@webapp/store/user/state'

export const MessageNotificationActionTypes = {
  SET_MESSAGES: 'ui/messageNotification/setMessages',
}

const fetchMessagesNotifiedToUser =
  ({ i18n }) =>
  async (dispatch, getState) => {
    const state = getState()
    const user = UserState.getUser(state)
    const messages = await API.fetchNotifiedMessages()
    const messagesWithReplacedVariables = messages.map(Messages.replaceBodyTemplateVariables({ user, i18n }))
    dispatch({ type: MessageNotificationActionTypes.SET_MESSAGES, messages: messagesWithReplacedVariables })
  }

export const MessageNotificationActions = {
  fetchMessagesNotifiedToUser,
}
