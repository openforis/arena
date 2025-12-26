import axios from 'axios'

import * as User from '@core/user/user'
import { appModuleUri, messageModules } from '@webapp/app/appModules'
import { UserState } from '@webapp/store/user'

export const createMessage =
  ({ navigate }) =>
  async (_dispatch, getState) => {
    const state = getState()
    const user = UserState.getUser(state)
    const messageParam = { createdByUserUuid: User.getUuid(user) }

    const { data: message } = await axios.post(`/api/message`, messageParam)

    navigate(`${appModuleUri(messageModules.message)}/${message.uuid}/`)
  }
