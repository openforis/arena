import * as API from '@webapp/service/api'

export const MessageNotificationActionTypes = {
  SET_MESSAGES: 'ui/messageNotification/setMessages',
}

const fetchMessagesNotifiedToUser = () => async (dispatch) => {
  const list = await API.fetchNotifiedMessages()
  dispatch({ type: MessageNotificationActionTypes.SET_MESSAGES, messages: list })
}

export const MessageNotificationActions = {
  fetchMessagesNotifiedToUser,
}
