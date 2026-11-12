import './UsersList.scss'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'

import { UserSurveysTable } from './UserSurveysTable'
import { TableHeaderLeft } from './TableHeaderLeft'
import { useUsersListColumns } from './useUsersListColumns'

const UserRowExpanded = ({ item }) => <UserSurveysTable user={item} />

UserRowExpanded.propTypes = {
  item: PropTypes.object.isRequired,
}

// users who have not accepted the invitation yet cannot be edited
const isRowOpenable = (user) => User.hasAccepted(user)

export const UsersList = () => {
  const navigate = useNavigate()
  const onRowOpen = useCallback(
    (user) => navigate(`${appModuleUri(userModules.user)}${User.getUuid(user)}`),
    [navigate]
  )
  const columns = useUsersListColumns({ isRowOpenable, onRowOpen })
  // the table is re-mounted (and its data fetched again) when its key changes
  const [tableKey, setTableKey] = useState(0)
  const onUsersRestored = useCallback(() => setTableKey((key) => key + 1), [])

  return (
    <Table
      key={tableKey}
      module="users"
      moduleApiUri="/api/users"
      className="users-list"
      columns={columns}
      expandableRows
      isRowExpandable={({ item }) => !User.isSystemAdmin(item)}
      isRowOpenable={isRowOpenable}
      onRowOpen={onRowOpen}
      rowExpandedComponent={UserRowExpanded}
      headerLeftComponent={TableHeaderLeft}
      headerProps={{ onUsersRestored }}
      visibleColumnsSelectionEnabled
    />
  )
}
