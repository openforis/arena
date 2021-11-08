import './UsersAccessRequest.scss'

import React, { useCallback, useState } from 'react'

import * as UserAccessRequest from '@core/user/userAccessRequest'

import Table from '@webapp/components/Table/Table'

import ColumnHeaders from './ColumnHeaders'
import Row from './Row'
import {TableHeaderLeft} from './TableHeaderLeft'

export const UsersAccessRequest = () => {
  const [requestedAt, setRequestedAt] = useState(Date.now())

  const onRowChange = useCallback(() => {
    // reload table content
    setRequestedAt(Date.now())
  }, [])

  return (
    <Table
      module="users-access-request"
      moduleApiUri="/api/users/users-access-request"
      restParams={{ requestedAt }}
      className="users-access-request-list"
      gridTemplateColumns={`20rem repeat(${UserAccessRequest.editableFields.length}, 1fr) 5rem 5rem`}
      headerLeftComponent={TableHeaderLeft}
      rowHeaderComponent={ColumnHeaders}
      rowComponent={Row}
      rowProps={{ onRowChange }}
    />
  )
}
