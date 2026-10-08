import './UsersList.scss'

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

  return (
    <Table
      module="users"
      moduleApiUri="/api/users"
      className="users-list"
      columns={columns}
      expandableRows
      isRowExpandable={({ item }) => !User.isSystemAdmin(item)}
      rowExpandedComponent={UserRowExpanded}
      headerLeftComponent={TableHeaderLeft}
      selectable={false}
      visibleColumnsSelectionEnabled
    />
  )
}
