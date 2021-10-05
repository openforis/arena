import React from 'react'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'
import ProfilePicture from '@webapp/components/profilePicture'

export const UsersList = () => {
  const history = useHistory()

  const onRowClick = (user) => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`)

  return (
    <Table
      module="users"
      moduleApiUri="/api/users"
      className="users-list"
      columns={[
        {
          key: 'profile-picture',
          width: '40px',
          cellRenderer: ({ row }) => <ProfilePicture userUuid={User.getUuid(row)} thumbnail />,
        },
        { key: 'email', header: 'common.email', cellRenderer: ({ row }) => User.getEmail(row) },
        { key: 'name', header: 'common.name', cellRenderer: ({ row }) => User.getName(row) },
        {
          key: 'is-system-admin',
          header: 'authGroups.systemAdmin.label',
          width: '15rem',
          cellRenderer: ({ row }) => User.isSystemAdmin(row) && <span className="icon icon-checkmark" />,
        },
        {
          key: 'is-survey-manager',
          header: 'authGroups.surveyManager.label',
          width: '15rem',
          cellRenderer: ({ row }) => User.isSurveyManager(row) && <span className="icon icon-checkmark" />,
        },
      ]}
      onRowClick={onRowClick}
    />
  )
}
