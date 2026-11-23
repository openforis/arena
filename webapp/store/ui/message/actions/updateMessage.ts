import axios from 'axios'

import * as Validation from '@core/validation/validation'
import * as MessageValidator from '@core/message/messageValidator'

import { AppSavingActions } from '@webapp/store/app'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { MessageActionTypes } from './actionTypes'

export const updateMessage =
  ({ message }) =>
  async (dispatch) => {
    const validation = await MessageValidator.validateMessage(message)
    const messageWithValidation = Validation.assocValidation(validation)(message)

    dispatch({ type: MessageActionTypes.messageUpdate, message: messageWithValidation })

    if (Validation.isValid(validation)) {
      const { uuid } = message

      const action = async () => {
        dispatch(AppSavingActions.showAppSaving())
        const { data: messageUpdated } = await axios.put(`/api/message/${uuid}`, message)
        dispatch({ type: MessageActionTypes.messageUpdate, message: messageUpdated })
        dispatch(AppSavingActions.hideAppSaving())
      }

      dispatch(debounceAction(action, `message_update_${uuid}`))
    }
  }
