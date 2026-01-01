import axios from 'axios'

import { AppSavingActions } from '@webapp/store/app'

import { MessageState } from '../state'
import { NotificationActions } from '../../notification'
import { appModuleUri, messageModules } from '@webapp/app/appModules'

export const deleteMessage =
  ({ navigate }) =>
  async (dispatch, getState) => {
    const state = getState()
    const message = MessageState.getMessage(state)
    const { uuid: messageUuid } = message

    dispatch(AppSavingActions.showAppSaving())

    await axios.delete(`/api/message/${messageUuid}`)

    dispatch(AppSavingActions.hideAppSaving())

    dispatch(NotificationActions.notifyInfo({ key: 'messageView:messageDeleted' }))

    // navigate to messages list
    navigate(appModuleUri(messageModules.messages))
  }
