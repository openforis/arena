import React from 'react'

import { appModules, appModuleUri, userModules } from '../../appModules'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import UsersListView from './userList/userListView'
import UserView from './user/userView'

const UsersView = () => (
  <InnerModuleSwitch
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
