const stateKey = 'message'

const getMessageState = (state) => state.ui[stateKey]

const getMessage = (state) => {
  const messageState = getMessageState(state)
  return messageState.message
}

export const MessageState = {
  stateKey,
  getMessage,
}
