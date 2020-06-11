import React from 'react'

import { appModules, appModuleUri, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import UsersListView from '@webapp/loggedin/modules/users/userList/userListView'
import UserView from '@webapp/loggedin/modules/users/user/userView'
import UserInviteView from '@webapp/loggedin/modules/users/userInvite/userInviteView'

const Users = () => (
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

export default Users
