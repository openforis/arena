import './UsersList.scss'

import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'

import Table from '@webapp/components/Table'

import { UserSurveysTable } from './UserSurveysTable'
import { TableHeaderLeft } from './TableHeaderLeft'
import { useUsersListColumns } from './useUsersListColumns'

const UserRowExpanded = ({ item }) => <UserSurveysTable user={item} />

UserRowExpanded.propTypes = {
  item: PropTypes.object.isRequired,
}

export const UsersList = () => {
  const columns = useUsersListColumns()
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
      rowExpandedComponent={UserRowExpanded}
      headerLeftComponent={TableHeaderLeft}
      headerProps={{ onUsersRestored }}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
