const stateKey = 'messageNotification'

const getMessageNotificationState = (state) => state.ui[stateKey]

const getMessages = (state) => {
  const messageNotificationState = getMessageNotificationState(state)
  return messageNotificationState.messages
}

export const MessageNotificationState = {
  stateKey,
  getMessages,
}
