import { fetchMessage } from './fetchMessage'
import { createMessage } from './createMessage'
import { updateMessage } from './updateMessage'
import { sendMessage } from './sendMessage'

export { MessageActionTypes } from './actionTypes'

export const MessageActions = {
  fetchMessage,
  createMessage,
  updateMessage,
  sendMessage,
}
