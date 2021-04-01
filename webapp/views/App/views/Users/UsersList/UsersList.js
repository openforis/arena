import './UsersList.scss'

import React from 'react'
import { useHistory } from 'react-router-dom'

import * as User from '@core/user/user'
import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useIsSystemAdminUser } from '@webapp/store/user'
import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const UsersList = () => {
  const history = useHistory()
  const isSystemAdmin = useIsSystemAdminUser()
  const onRowClick = (user) => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`)

  return (
    <Table
      module="users"
      className="users-list"
      gridTemplateColumns={`35px repeat(${isSystemAdmin ? 5 : 4}, 1fr) 10rem 50px`}
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      onRowClick={onRowClick}
    />
  )
}

export default UsersList
