import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'

import UserGroupsList from './UserGroupsList'
import UserGroupsSummary from './UserGroupsSummary'

/**
 * User Groups overview page for a survey: toggles between the groups list and a summary/overview
 * table of every survey user's group assignment.
 *
 * @returns {React.ReactElement} - The UserGroupsOverview component.
 */
const UserGroupsOverview = (): React.ReactElement => {
  const i18n = useI18n()
  const [showSummary, setShowSummary] = useState(false)

  return (
    <div className="user-groups-overview">
      <div className="user-groups-overview__tabs">
        <button type="button" className={!showSummary ? 'active' : ''} onClick={() => setShowSummary(false)}>
          {i18n.t('usersView:userGroups')}
        </button>
        <button type="button" className={showSummary ? 'active' : ''} onClick={() => setShowSummary(true)}>
          {i18n.t('usersView:userGroup.overview')}
        </button>
      </div>
      {showSummary ? <UserGroupsSummary /> : <UserGroupsList />}
    </div>
  )
}

export default UserGroupsOverview
