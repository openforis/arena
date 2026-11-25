import { createMessage } from './createMessage'
import { deleteMessage } from './deleteMessage'
import { fetchMessage } from './fetchMessage'
import { resetMessage } from './resetMessage'
import { sendMessage } from './sendMessage'
import { updateMessage } from './updateMessage'

export { MessageActionTypes } from './actionTypes'

export const MessageActions = {
  fetchMessage,
  createMessage,
  updateMessage,
  sendMessage,
  deleteMessage,
  resetMessage,
}
