import React, { useMemo } from 'react'

import { Objects } from '@openforis/arena-core'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'

import { appModules, userModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import { useUser } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'

import { UsersList } from './UsersList'
import UsersListSurvey from './UsersListSurvey'
import UserInvite from './UserInvite'
import UserEdit from './UserEdit'
import { UsersAccessRequest } from './UsersAccessRequest'
import UserPasswordChange from './UserPasswordChange'

const Users = () => {
  const user = useUser()
  const surveyInfo = useSurveyInfo()

  const modules = useMemo(
    () => [
      ...(Authorizer.canViewAllUsers(user)
        ? [
            {
              component: UsersList,
              path: userModules.users.path,
            },
          ]
        : []),
      ...(Objects.isNotEmpty(surveyInfo) &&
      Authorizer.canViewSurveyUsers(user, surveyInfo) &&
      !Survey.isTemplate(surveyInfo)
        ? [
            {
              component: UsersListSurvey,
              path: userModules.usersSurvey.path,
            },
            {
              component: UserInvite,
              path: userModules.userInvite.path,
            },
          ]
        : []),
      ...(Authorizer.canViewUsersAccessRequests(user)
        ? [
            {
              component: UsersAccessRequest,
              path: userModules.usersAccessRequest.path,
            },
          ]
        : []),
      {
        component: UserEdit,
        path: `${userModules.user.path}/:userUuid`,
      },
      {
        component: UserPasswordChange,
        path: userModules.userPasswordChange.path,
      },
    ],
    [surveyInfo, user]
  )
  return <ModuleSwitch moduleRoot={appModules.users} moduleDefault={userModules.usersSurvey} modules={modules} />
}

export default Users
