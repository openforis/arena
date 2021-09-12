import './UsersAccessRequest.scss'

import React from 'react'

import * as UserAccessRequest from '@core/user/userAccessRequest'

import Table from '@webapp/components/Table/Table'

import ColumnHeaders from './ColumnHeaders'
import Row from './Row'

export const UsersAccessRequest = () => {
  return (
    <Table
      module="users-access-request"
      moduleApiUri="/api/users/users-access-request"
      className="users-access-request-list"
      gridTemplateColumns={`20rem repeat(${UserAccessRequest.editableFields.length}, 1fr) 5rem 5rem`}
      rowHeaderComponent={ColumnHeaders}
      rowComponent={Row}
    />
  )
}
