import React, { useMemo } from 'react'

import { Objects } from '@openforis/arena-core'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as ProcessUtils from '@core/processUtils'

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

  const modules = useMemo(() => {
    const _modules = []
    if (Authorizer.canViewAllUsers(user)) {
      _modules.push({
        component: UsersList,
        path: userModules.users.path,
      })
    }
    if (Authorizer.canCreateUsers(user)) {
      _modules.push({
        component: UserEdit,
        path: userModules.userNew.path,
      })
    }
    if (
      Objects.isNotEmpty(surveyInfo) &&
      Authorizer.canViewSurveyUsers(user, surveyInfo) &&
      !Survey.isTemplate(surveyInfo)
    ) {
      _modules.push(
        {
          component: UsersListSurvey,
          path: userModules.usersSurvey.path,
        },
        {
          component: UserInvite,
          path: userModules.userInvite.path,
        }
      )
    }
    if (ProcessUtils.ENV.allowUserAccessRequest && Authorizer.canViewUsersAccessRequests(user)) {
      _modules.push({
        component: UsersAccessRequest,
        path: userModules.usersAccessRequest.path,
      })
    }
    _modules.push(
      {
        component: UserEdit,
        path: `${userModules.user.path}/:userUuid`,
      },
      {
        component: UserPasswordChange,
        path: userModules.userPasswordChange.path,
      }
    )
    return _modules
  }, [surveyInfo, user])

  return <ModuleSwitch moduleRoot={appModules.users} moduleDefault={userModules.usersSurvey} modules={modules} />
}

export default Users
