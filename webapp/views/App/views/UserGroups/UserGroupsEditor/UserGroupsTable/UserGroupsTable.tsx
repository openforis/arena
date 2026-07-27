import React, { useMemo } from 'react'
import { GridColDef } from '@mui/x-data-grid'

import { useI18n } from '@webapp/store/system'
import { DataGrid } from '@webapp/components/DataGrid'
import LoadingBar from '@webapp/components/LoadingBar'

import { useUserGroupsTable } from './useUserGroupsTable'

/**
 * User Groups report table: one row per group-member pair, listing group name, label and
 * qualifiers alongside the member's name, email, survey role and account status. Groups without
 * members are shown with a single, empty-member row so every group stays visible.
 *
 * @returns {React.ReactElement} - The UserGroupsTable component.
 */
const UserGroupsTable = (): React.ReactElement => {
  const i18n = useI18n()
  const { rows, loading } = useUserGroupsTable()

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'groupName', headerName: i18n.t('usersView:userGroup.name'), flex: 1 },
      { field: 'groupLabel', headerName: i18n.t('usersView:userGroup.label'), flex: 1 },
      { field: 'qualifiers', headerName: i18n.t('usersView:userGroup.qualifier_plural'), flex: 1.5 },
      { field: 'memberName', headerName: i18n.t('usersView:userGroup.memberName'), flex: 1 },
      { field: 'memberEmail', headerName: i18n.t('usersView:userGroup.memberEmail'), flex: 1.5 },
      {
        field: 'memberRole',
        headerName: i18n.t('usersView:userGroup.memberRole'),
        flex: 1,
        valueGetter: (_value, row) => (row.memberRole ? i18n.t(`auth:authGroups.${row.memberRole}.label`) : ''),
      },
      {
        field: 'memberStatus',
        headerName: i18n.t('usersView:userGroup.memberStatus'),
        flex: 1,
        valueGetter: (_value, row) =>
          row.memberStatus ? i18n.t(`usersView:userGroup.status.${row.memberStatus}`) : '',
      },
    ],
    [i18n]
  )

  if (loading) {
    return <LoadingBar />
  }

  return <DataGrid className="user-groups-table" columns={columns} rows={rows} />
}

export default UserGroupsTable
