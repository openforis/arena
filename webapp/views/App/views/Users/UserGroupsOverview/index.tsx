import './UserGroupsOverview.scss'

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'
import { useAuthCanManageUserGroups } from '@webapp/store/user'
import { ButtonIconAdd } from '@webapp/components'
import { useQuery } from '@webapp/components/hooks'
import { appModuleUri, userModules } from '@webapp/app/appModules'

import UserGroupsList from './UserGroupsList'
import UserGroupsSummary from './UserGroupsSummary'
import UserGroupsTable from './UserGroupsTable'

// appModules.js is a plain JS module without explicit types: TS infers appModuleUri's parameter shape
// from its default value (appModules.home), which happens to include an `icon` field that userModules
// entries don't have (and that appModuleUri never reads). Cast to the function's own inferred parameter
// type rather than editing that shared, out-of-scope module.
type AppModule = Parameters<typeof appModuleUri>[0]

const ViewMode = {
  list: 'list',
  overview: 'overview',
  table: 'table',
} as const

type ViewModeType = (typeof ViewMode)[keyof typeof ViewMode]

const isViewMode = (value: unknown): value is ViewModeType =>
  value === ViewMode.list || value === ViewMode.overview || value === ViewMode.table

/**
 * User Groups overview page for a survey: toggles between the groups list, a Kanban-style summary
 * of every survey user's group assignment, and a flat report table (one row per group-member pair).
 * The summary and table view modes are only shown to users who can manage user groups; other users
 * only ever see the groups list. The "New Group" button is shown in every view mode to users
 * allowed to manage groups. The active view mode is kept in the URL's `view` query param (replacing
 * history rather than pushing) so that the "Back" button on the create/edit group page - a plain
 * `navigate(-1)` - lands back on whichever tab the user came from.
 *
 * @returns {React.ReactElement} - The UserGroupsOverview component.
 */
const UserGroupsOverview = (): React.ReactElement => {
  const i18n = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const canManage = useAuthCanManageUserGroups()
  // useQuery's untyped implementation makes TS infer its return type as `{}`; cast to the
  // `Record<string, string>` shape its `URLSearchParams`-driven implementation actually returns.
  const query = useQuery() as Record<string, string>
  const viewMode = isViewMode(query.view) ? query.view : ViewMode.list

  const effectiveViewMode = canManage ? viewMode : ViewMode.list

  const setViewMode = (mode: ViewModeType): void => {
    const search = mode === ViewMode.list ? '' : `?view=${mode}`
    navigate({ pathname: location.pathname, search }, { replace: true })
  }

  return (
    <div className="user-groups-overview">
      <div className="user-groups-overview__bar">
        <div className="user-groups-overview__tabs">
          <button
            type="button"
            className={effectiveViewMode === ViewMode.list ? 'active' : ''}
            onClick={() => setViewMode(ViewMode.list)}
          >
            {i18n.t('usersView:userGroups')}
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className={effectiveViewMode === ViewMode.overview ? 'active' : ''}
                onClick={() => setViewMode(ViewMode.overview)}
              >
                {i18n.t('usersView:userGroup.overview')}
              </button>
              <button
                type="button"
                className={effectiveViewMode === ViewMode.table ? 'active' : ''}
                onClick={() => setViewMode(ViewMode.table)}
              >
                {i18n.t('usersView:userGroup.table')}
              </button>
            </>
          )}
        </div>
        {canManage && (
          <ButtonIconAdd
            showLabel
            label="usersView:userGroup.new"
            onClick={() => navigate(appModuleUri(userModules.userGroupNew as AppModule))}
            variant="contained"
          />
        )}
      </div>
      {effectiveViewMode === ViewMode.overview && <UserGroupsSummary />}
      {effectiveViewMode === ViewMode.table && <UserGroupsTable />}
      {effectiveViewMode === ViewMode.list && <UserGroupsList />}
    </div>
  )
}

export default UserGroupsOverview
