import axios from 'axios'

import { MessageNotificationType, MessagePropsKey, MessageStatus, MessageTargetUserType } from '@openforis/arena-core'

import * as User from '@core/user/user'
import { appModuleUri, messageModules } from '@webapp/app/appModules'
import { UserState } from '@webapp/store/user'

const defaultMessageBody = `Dear {{userTitleAndName}},  

MESSAGE CONTENT  
  
Many thanks,  
The Open Foris Arena Team`

export const createMessage =
  ({ navigate }) =>
  async (_dispatch, getState) => {
    const state = getState()
    const user = UserState.getUser(state)

    const messageParam = {
      status: MessageStatus.Draft,
      props: {
        [MessagePropsKey.subject]: 'Open Foris Arena - Communication',
        [MessagePropsKey.body]: defaultMessageBody,
        [MessagePropsKey.notificationTypes]: [MessageNotificationType.Email, MessageNotificationType.PushNotification],
        [MessagePropsKey.targetUserTypes]: [MessageTargetUserType.All],
      },
      createdByUserUuid: User.getUuid(user),
    }

    const { data: message } = await axios.post(`/api/message`, messageParam)

    navigate(`${appModuleUri(messageModules.message)}/${message.uuid}/`)
  }
