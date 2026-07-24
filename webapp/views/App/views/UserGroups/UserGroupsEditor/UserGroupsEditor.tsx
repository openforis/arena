import './UserGroupsEditor.scss'

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthCanManageUserGroups } from '@webapp/store/user'
import { ButtonIconAdd } from '@webapp/components'
import { Tabs } from '@webapp/components/Tabs'
import { useQuery } from '@webapp/components/hooks'
import { appModuleUri, userModules } from '@webapp/app/appModules'

import UserGroupsList from './UserGroupsList'
import UserGroupsOverview from './UserGroupsOverview'
import UserGroupsTable from './UserGroupsTable'

// appModules.js is a plain JS module without explicit types: TS infers appModuleUri's parameter shape
// from its default value (appModules.home), which happens to include an `icon` field that userModules
// entries don't have (and that appModuleUri never reads). Cast to the function's own inferred parameter
// type rather than editing that shared, out-of-scope module.
type AppModule = Parameters<typeof appModuleUri>[0]

const ViewMode = {
  groups: 'groups',
  assignments: 'assignments',
  report: 'report',
} as const

type ViewModeType = (typeof ViewMode)[keyof typeof ViewMode]

const isViewMode = (value: unknown): value is ViewModeType =>
  value === ViewMode.groups || value === ViewMode.assignments || value === ViewMode.report

/**
 * User Groups management page for a survey: toggles between the plain groups list
 * (ViewMode.groups), a Kanban-style board of every survey user's group assignment
 * (ViewMode.assignments, rendered by UserGroupsOverview) and a flat report table with one row per
 * group-member pair (ViewMode.report). The assignments and report view modes are only shown to
 * users who can manage user groups; other users only ever see the groups list. The "New Group"
 * button is shown in every view mode to users allowed to manage groups. The active view mode is
 * kept in the URL's `view` query param (replacing history rather than pushing) so that the "Back"
 * button on the create/edit group page - a plain `navigate(-1)` - lands back on whichever tab the
 * user came from.
 *
 * @returns {React.ReactElement} - The UserGroupsEditor component.
 */
const UserGroupsEditor = (): React.ReactElement => {
  const navigate = useNavigate()
  const location = useLocation()
  const canManage = useAuthCanManageUserGroups()
  // useQuery's untyped implementation makes TS infer its return type as `{}`; cast to the
  // `Record<string, string>` shape its `URLSearchParams`-driven implementation actually returns.
  const query = useQuery() as Record<string, string>
  const viewMode = isViewMode(query.view) ? query.view : ViewMode.groups

  const effectiveViewMode = canManage ? viewMode : ViewMode.groups

  const setViewMode = (mode: ViewModeType): void => {
    const search = mode === ViewMode.groups ? '' : `?view=${mode}`
    navigate({ pathname: location.pathname, search }, { replace: true })
  }

  const fillHeight = effectiveViewMode === ViewMode.assignments

  // The assignments and report tabs are only offered to users who can manage user groups; other
  // users only ever see the groups list, so its tab is the only one always present. Content isn't
  // rendered via each item's renderContent - it's kept as a sibling of the bar below (see return)
  // instead of nested inside it, so the assignments tab's Kanban board can still fill the page's
  // remaining height; Tabs nests renderContent's output inside the bar's row, which would defeat
  // that layout.
  const tabItems = [
    { key: ViewMode.groups, label: 'usersView:userGroup.tabs.groups' },
    ...(canManage
      ? [
          { key: ViewMode.assignments, label: 'usersView:userGroup.tabs.assignments' },
          { key: ViewMode.report, label: 'usersView:userGroup.tabs.report' },
        ]
      : []),
  ]

  return (
    <div className={`user-groups-editor${fillHeight ? ' user-groups-editor--fill' : ''}`}>
      <div className="user-groups-editor__bar">
        <Tabs fullWidth items={tabItems} selectedItemKey={effectiveViewMode} onChange={setViewMode} />
        {canManage && (
          <ButtonIconAdd
            showLabel
            label="usersView:userGroup.new"
            onClick={() => navigate(appModuleUri(userModules.userGroupNew as AppModule))}
            variant="contained"
          />
        )}
      </div>
      {effectiveViewMode === ViewMode.assignments && <UserGroupsOverview />}
      {effectiveViewMode === ViewMode.report && <UserGroupsTable />}
      {effectiveViewMode === ViewMode.groups && <UserGroupsList />}
    </div>
  )
}

export default UserGroupsEditor
