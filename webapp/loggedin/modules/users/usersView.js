import React from 'react'

import { appModules, appModuleUri, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import UsersListView from './userList/userListView'
import UserView from './user/userView'

const UsersView = () => (
  <ModuleSwitch
    moduleRoot={appModules.users}
    moduleDefault={userModules.users}
    modules={[
      {
        component: UsersListView,
        path: appModuleUri(userModules.users),
      },
      {
        component: UserView,
        path: `${appModuleUri(userModules.user)}`,
      },
      {
        component: UserView,
        path: `${appModuleUri(userModules.user)}:userUuid`,
      },
    ]}
  />
)

export default UsersView
