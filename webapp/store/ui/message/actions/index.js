import { fetchMessage } from './fetchMessage'
import { createMessage } from './createMessage'
import { updateMessage } from './updateMessage'
import { sendMessage } from './sendMessage'
import { deleteMessage } from './deleteMessage'
import { resetMessage } from './resetMessage'

export { MessageActionTypes } from './actionTypes'

export const MessageActions = {
  fetchMessage,
  createMessage,
  updateMessage,
  sendMessage,
  deleteMessage,
  resetMessage,
}
