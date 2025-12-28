import React from 'react'

import { appModules, messageModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import MessageDetails from './MessageDetails'
import { MessageList } from './MessageList'

const MessageModule = () => {
  return (
    <ModuleSwitch
      moduleRoot={appModules.message}
      moduleDefault={messageModules.messages}
      modules={[
        {
          component: MessageList,
          path: messageModules.messages.path,
        },
        {
          component: MessageDetails,
          path: `${messageModules.message.path}/:messageUuid/`,
        },
      ]}
    />
  )
}

export default MessageModule
