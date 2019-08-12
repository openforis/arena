import React from 'react'

import { appModules, appModuleUri, userModules } from '../../appModules'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import UsersListView from './userList/userListView'
import UserInviteView from './userInvite/userInviteView'
import UserView from './user/userView'

const UsersView = () => (
  <InnerModuleSwitch
    moduleRoot={appModules.users}
    moduleDefault={userModules.userList}
    modules={[
      {
        component: UsersListView,
        path: appModuleUri(userModules.users),
      },
      {
        component: UserInviteView,
        path: appModuleUri(userModules.userInvite),
      },
      {
        component: UserView,
        path: `${appModuleUri(userModules.user)}:userUuid/`,
      },
    ]}
  />
)

export default UsersView
