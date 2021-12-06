import React from 'react'

import { appModules, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { UsersList } from './UsersList'
import UsersListSurvey from './UsersListSurvey'
import UserInvite from './UserInvite'
import UserEdit from './UserEdit'
import { UsersAccessRequest } from './UsersAccessRequest'

const Users = () => (
  <ModuleSwitch
    moduleRoot={appModules.users}
    moduleDefault={userModules.usersSurvey}
    modules={[
      {
        component: UsersList,
        path: userModules.users.path,
      },
      {
        component: UsersListSurvey,
        path: userModules.usersSurvey.path,
      },
      {
        component: UserEdit,
        path: `${userModules.user.path}/:userUuid`,
      },
      {
        component: UserInvite,
        path: userModules.userInvite.path,
      },
      {
        component: UsersAccessRequest,
        path: userModules.usersAccessRequest.path,
      },
    ]}
  />
)

export default Users
