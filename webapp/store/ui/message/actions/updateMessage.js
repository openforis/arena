import axios from 'axios'

import { AppSavingActions } from '@webapp/store/app'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { MessageActionTypes } from './actionTypes'

export const updateMessage =
  ({ message }) =>
  async (dispatch) => {
    dispatch({ type: MessageActionTypes.messageUpdate, message })

    const { uuid } = message

    const action = async () => {
      dispatch(AppSavingActions.showAppSaving())
      const { data: messageUpdated } = await axios.put(`/api/message/${uuid}`, message)
      dispatch({ type: MessageActionTypes.messageUpdate, message: messageUpdated })
      dispatch(AppSavingActions.hideAppSaving())
    }

    dispatch(debounceAction(action, `message_update_${uuid}`))
  }
