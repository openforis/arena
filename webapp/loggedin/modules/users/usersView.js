import React from 'react'

import { appModules, appModuleUri, userModules } from '../../appModules'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import UsersListView from './userList/userListView'

const UsersView = () => (
  <InnerModuleSwitch
    moduleRoot={appModules.users}
    moduleDefault={userModules.userList}
    modules={[
      {
        component: UsersListView,
        path: appModuleUri(userModules.users),
      },
    ]}
  />
)

export default UsersView