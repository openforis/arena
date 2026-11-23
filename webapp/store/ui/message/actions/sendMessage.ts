import axios from 'axios'

import { AppSavingActions, JobActions } from '@webapp/store/app'

import { MessageState } from '../state'
import { fetchMessage } from './fetchMessage'

export const sendMessage = () => async (dispatch, getState) => {
  const state = getState()
  const message = MessageState.getMessage(state)
  const { uuid: messageUuid } = message
  dispatch(AppSavingActions.showAppSaving())
  const { data: job } = await axios.post(`/api/message/send`, { messageUuid })
  dispatch(
    JobActions.showJobMonitor({
      job,
      onComplete: () => {
        dispatch(fetchMessage({ messageUuid }))
      },
    })
  )
  dispatch(AppSavingActions.hideAppSaving())
}
