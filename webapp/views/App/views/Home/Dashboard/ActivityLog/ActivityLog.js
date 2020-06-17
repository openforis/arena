import './ActivityLog.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'

import Message from './Message'
import { useActivityLog } from './store'

const ActivityLog = () => {
  const i18n = useI18n()

  const { messages } = useActivityLog()

  return (
    <div className="activity-log">
      <div className="activity-log__header">{i18n.t('activityLogView.recentActivity')}</div>

      <div className="activity-log__messages">
        {(messages || []).map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}

export default ActivityLog
