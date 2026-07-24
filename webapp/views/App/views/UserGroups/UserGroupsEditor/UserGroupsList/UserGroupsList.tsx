import './UserGroupsList.scss'

import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GridColDef, GridRowParams } from '@mui/x-data-grid'

import * as UserGroup from '@core/user/userGroup/userGroup'
import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DataGrid } from '@webapp/components/DataGrid'
import LoadingBar from '@webapp/components/LoadingBar'

import { useUserGroupsList } from './useUserGroupsList'

// appModules.js is a plain JS module without explicit types: TS infers appModuleUri's parameter shape
// from its default value (appModules.home), which happens to include an `icon` field that userModules
// entries don't have (and that appModuleUri never reads). Cast to the function's own inferred parameter
// type rather than editing that shared, out-of-scope module.
type AppModule = Parameters<typeof appModuleUri>[0]

/**
 * User Groups list table, listing the user groups defined in the current survey.
 *
 * @returns {React.ReactElement} - The UserGroupsList component.
 */
const UserGroupsList = (): React.ReactElement => {
  const i18n = useI18n()
  const navigate = useNavigate()
  const preferredLang = useSurveyPreferredLang() as string
  const { rows, loading } = useUserGroupsList()

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: i18n.t('usersView:userGroup.name'),
        flex: 1,
        valueGetter: (_value, row) => UserGroup.getName(row),
      },
      {
        field: 'label',
        headerName: i18n.t('usersView:userGroup.label'),
        flex: 1,
        valueGetter: (_value, row) => UserGroup.getLabel(preferredLang)(row),
      },
      {
        field: 'qualifiers',
        headerName: i18n.t('usersView:userGroup.qualifier_plural'),
        flex: 1,
        valueGetter: (_value, row) => UserGroup.getQualifiers(row).length,
      },
      {
        field: 'membersCount',
        headerName: i18n.t('usersView:userGroup.members'),
        flex: 1,
      },
    ],
    [i18n, preferredLang]
  )

  const onRowClick = (params: GridRowParams): void =>
    navigate(`${appModuleUri(userModules.userGroup as AppModule)}${UserGroup.getUuid(params.row)}`)

  if (loading) {
    return <LoadingBar />
  }

  return (
    <DataGrid
      className="user-groups-list"
      columns={columns}
      rows={rows}
      getRowId={(row) => UserGroup.getUuid(row) as string}
      onRowClick={onRowClick}
      autoHeight
    />
  )
}

export default UserGroupsList
