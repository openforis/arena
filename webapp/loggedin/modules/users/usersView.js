import React from 'react'

import { appModules, appModuleUri, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import UsersListView from './userList/userListView'
import UserView from './user/userView'
import UserInviteView from './userInvite/userInviteView'

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
        path: `${appModuleUri(userModules.user)}:userUuid`,
      },
      {
        component: UserInviteView,
        path: `${appModuleUri(userModules.userInvite)}`,
      },
    ]}
  />
)

export default UsersView
