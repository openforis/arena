import './UsersList.scss'

import React from 'react'

import * as User from '@core/user/user'

import Table from '@webapp/components/Table'

import { UserSurveysTable } from './UserSurveysTable'
import { TableHeaderLeft } from './TableHeaderLeft'
import { useUsersListColumns } from './useUsersListColumns'

export const UsersList = () => {
  const columns = useUsersListColumns()

  return (
    <Table
      module="users"
      moduleApiUri="/api/users"
      className="users-list"
      columns={columns}
      expandableRows
      isRowExpandable={({ item }) => !User.isSystemAdmin(item)}
      rowExpandedComponent={({ item }) => <UserSurveysTable user={item} />}
      headerLeftComponent={TableHeaderLeft}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
