import { Messages } from '@openforis/arena-core'

import * as API from '@webapp/service/api'

export const MessageNotificationActionTypes = {
  SET_MESSAGES: 'ui/messageNotification/setMessages',
}

// the user is passed explicitly: on app init it is not in the store yet
const fetchMessagesNotifiedToUser =
  ({ i18n, user }) =>
  async (dispatch) => {
    const messages = await API.fetchNotifiedMessages()
    const messagesWithReplacedVariables = messages.map(Messages.replaceBodyTemplateVariables({ user, i18n }))
    dispatch({ type: MessageNotificationActionTypes.SET_MESSAGES, messages: messagesWithReplacedVariables })
  }

export const MessageNotificationActions = {
  fetchMessagesNotifiedToUser,
}
