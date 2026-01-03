import axios from 'axios'

import { MessageNotificationType, MessageStatus, MessageTarget } from '@openforis/arena-core'

import * as User from '@core/user/user'
import { appModuleUri, messageModules } from '@webapp/app/appModules'
import { UserState } from '@webapp/store/user'

const defaultMessageBody = `Dear {{userTitleAndName}},  

MESSAGE CONTENT  
  
Many thanks,  
Open Foris Arena Team`

export const createMessage =
  ({ navigate }) =>
  async (_dispatch, getState) => {
    const state = getState()
    const user = UserState.getUser(state)

    const messageParam = {
      status: MessageStatus.Draft,
      props: {
        subject: 'Open Foris Arena - Communication',
        body: defaultMessageBody,
        notificationTypes: [MessageNotificationType.Email],
        targets: [MessageTarget.All],
      },
      createdByUserUuid: User.getUuid(user),
    }

    const { data: message } = await axios.post(`/api/message`, messageParam)

    navigate(`${appModuleUri(messageModules.message)}/${message.uuid}/`)
  }
