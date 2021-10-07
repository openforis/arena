import './UsersList.scss'

import React from 'react'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'

// import { appModuleUri, userModules } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'
import ProfilePicture from '@webapp/components/profilePicture'
// import { ButtonIconEdit } from '@webapp/components'

import { UserSurveysTable } from './UserSurveysTable'

export const UsersList = () => {
  const history = useHistory()

  // const goToUserDetails = (user) =>
  //   history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}?hideSurveyGroup=true`)

  return (
    <Table
      module="users"
      moduleApiUri="/api/users"
      className="users-list"
      columns={[
        {
          key: 'profile-picture',
          width: '40px',
          renderItem: ({ item }) => <ProfilePicture userUuid={User.getUuid(item)} thumbnail />,
        },
        { key: 'email', header: 'common.email', renderItem: ({ item }) => User.getEmail(item) },
        { key: 'name', header: 'common.name', renderItem: ({ item }) => User.getName(item) },
        {
          key: 'is-system-admin',
          header: 'authGroups.systemAdmin.label',
          width: '15rem',
          renderItem: ({ item }) => User.isSystemAdmin(item) && <span className="icon icon-checkmark" />,
        },
        {
          key: 'is-survey-manager',
          header: 'authGroups.surveyManager.label',
          width: '15rem',
          renderItem: ({ item }) => User.isSurveyManager(item) && <span className="icon icon-checkmark" />,
        },
        // {
        //   key: 'user-edit',
        //   width: '40px',
        //   renderItem: ({ item }) => <ButtonIconEdit onClick={() => goToUserDetails(item)} />,
        // },
      ]}
      expandableRows
      isRowExpandable={({ item }) => !User.isSystemAdmin(item)}
      rowExpandedComponent={({ item }) => <UserSurveysTable user={item} />}
    />
  )
}
