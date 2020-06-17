import './ActivityLog.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'

import { useActivityLog, ActivityLogMessage } from './store'

import Message from './Message'

const ActivityLog = () => {
  const i18n = useI18n()

  const { messages } = useActivityLog()

  return (
    <div className="activity-log">
      <div className="activity-log__header">{i18n.t('activityLogView.recentActivity')}</div>

      <div className="activity-log__messages">
        {messages.map((message) => (
          <Message key={ActivityLogMessage.getId(message)} message={message} />
        ))}
      </div>
    </div>
  )
}

export default ActivityLog
