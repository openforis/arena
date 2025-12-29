import axios from 'axios'

import { MessageActionTypes } from './actionTypes'

export const fetchMessage =
  ({ messageUuid }) =>
  async (dispatch) => {
    const {
      data: { message },
    } = await axios.get(`/api/message/${messageUuid}`)

    dispatch({ type: MessageActionTypes.messageUpdate, message })
  }
