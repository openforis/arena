import React from 'react'

import { appModules, appModuleUri, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import UsersList from './UsersList'
import UserInvite from './UserInvite'
import UserEdit from './UserEdit'
import { UsersAccessRequest } from './UsersAccessRequest'

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
        component: UserEdit,
        path: `${appModuleUri(userModules.user)}:userUuid`,
      },
      {
        component: UserInvite,
        path: `${appModuleUri(userModules.userInvite)}`,
      },
      {
        component: UsersAccessRequest,
        path: appModuleUri(userModules.usersAccessRequest),
      },
    ]}
  />
)

export default Users
