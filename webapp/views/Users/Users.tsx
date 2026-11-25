import { useMemo } from 'react'

import { Authorizer, Objects } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import { appModules, userModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/ModuleSwitch'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'
import UserGroupsEditor from '../UserGroups'
import UserGroupEdit from '../UserGroups/UserGroupEdit'

import User2FADevice from './User2FADevice'
import UserEdit from './UserEdit'
import UserInvite from './UserInvite'
import UserPasswordChange from './UserPasswordChange'
import { UsersAccessRequest } from './UsersAccessRequest'
import { UsersList } from './UsersList'
import UsersListSurvey from './UsersListSurvey'

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
      if (Authorizer.canManageUserGroups(user, surveyInfo)) {
        _modules.push(
          {
            component: UserGroupsEditor,
            path: userModules.userGroups.path,
          },
          {
            component: UserGroupEdit,
            path: userModules.userGroupNew.path,
          },
          {
            component: UserGroupEdit,
            path: `${userModules.userGroup.path}/:groupUuid`,
          }
        )
      }
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
        path: userModules.user.path,
        props: { ownProfile: true },
      },
      {
        component: UserEdit,
        path: `${userModules.user.path}/:userUuid`,
      },
      {
        component: UserPasswordChange,
        path: `${userModules.userPasswordChange.path}/:userUuid?`,
      },
      // every user manages their own 2FA devices
      {
        component: User2FADevice,
        path: `${userModules.user2FADevices.path}/*`,
      }
    )
    return _modules
  }, [surveyInfo, user])

  return <ModuleSwitch moduleRoot={appModules.users} moduleDefault={userModules.usersSurvey} modules={modules} />
}

export default Users
