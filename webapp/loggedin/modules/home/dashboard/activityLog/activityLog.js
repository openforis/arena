import './activityLog.scss'

import React from 'react'

import { useI18n } from '../../../../../commonComponents/hooks'

const ActivityLog = props => {

  const i18n = useI18n()

  return (
    <div className="activity-log">

      <div className="activity-log__header">
        {i18n.t('homeView.activityLog.recentActivity')}
      </div>

    </div>
  )

}

export default ActivityLog