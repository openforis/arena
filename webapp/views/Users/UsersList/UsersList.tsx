import './UsersList.scss'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ArenaUser } from '@openforis/arena-core'

import * as User from '@core/user/user'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'
import { useUserIsSystemAdmin } from '@webapp/store/user'

import { UserSurveysTable } from './UserSurveysTable'
import { TableHeaderLeft } from './TableHeaderLeft'
import { useUsersListColumns } from './useUsersListColumns'

type UserRowExpandedProps = {
  item: ArenaUser
}

const UserRowExpanded = ({ item }: UserRowExpandedProps) => <UserSurveysTable user={item} />

// users who have not accepted the invitation yet cannot be edited
const isRowOpenable = (user) => User.hasAccepted(user)

const isRowExpandable = ({ item }) => !User.isSystemAdmin(item)

export const UsersList = () => {
  const navigate = useNavigate()
  const onRowOpen = useCallback(
    (user) => navigate(`${appModuleUri(userModules.user)}${User.getUuid(user)}`),
    [navigate]
  )
  // system admins can select users to back up only some of them (row click still opens the user)
  const isSystemAdmin = useUserIsSystemAdmin()
  const columns = useUsersListColumns({ isRowOpenable, onRowOpen, selectable: isSystemAdmin })
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
      isRowExpandable={isRowExpandable}
      isRowOpenable={isRowOpenable}
      keepSelectionOnSearch
      onRowOpen={onRowOpen}
      rowExpandedComponent={UserRowExpanded}
      headerLeftComponent={TableHeaderLeft}
      headerProps={{ onUsersRestored }}
      visibleColumnsSelectionEnabled
    />
  )
}
