import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { useAuthCanManageUserGroups } from '@webapp/store/user'

import UserGroupsList from './UserGroupsList'
import UserGroupsSummary from './UserGroupsSummary'

/**
 * User Groups overview page for a survey: toggles between the groups list and a Kanban-style
 * summary of every survey user's group assignment. The summary tab (and view) is only shown to
 * users who can manage user groups; other users only ever see the groups list.
 *
 * @returns {React.ReactElement} - The UserGroupsOverview component.
 */
const UserGroupsOverview = (): React.ReactElement => {
  const i18n = useI18n()
  const canManage = useAuthCanManageUserGroups()
  const [showSummary, setShowSummary] = useState(false)

  const displaySummary = showSummary && canManage

  return (
    <div className="user-groups-overview">
      <div className="user-groups-overview__tabs">
        <button type="button" className={!displaySummary ? 'active' : ''} onClick={() => setShowSummary(false)}>
          {i18n.t('usersView:userGroups')}
        </button>
        {canManage && (
          <button type="button" className={displaySummary ? 'active' : ''} onClick={() => setShowSummary(true)}>
            {i18n.t('usersView:userGroup.overview')}
          </button>
        )}
      </div>
      {displaySummary ? <UserGroupsSummary /> : <UserGroupsList />}
    </div>
  )
}

export default UserGroupsOverview
