import React from 'react'

import { appModules, appModuleUri, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import UserView from '@webapp/loggedin/modules/users/user/userView'

import UsersList from './UsersList'
import UserInvite from './UserInvite'

const Users = () => (
  <ModuleSwitch
    moduleRoot={appModules.users}
    moduleDefault={userModules.users}
    modules={[
      {
        component: UsersList,
        path: appModuleUri(userModules.users),
      },
      {
        component: UserView,
        path: `${appModuleUri(userModules.user)}:userUuid`,
      },
      {
        component: UserInvite,
        path: `${appModuleUri(userModules.userInvite)}`,
      },
    ]}
  />
)

export default Users
