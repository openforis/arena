import './ActivityLog.scss'

import React from 'react'
import * as R from 'ramda'

import { useOnIntersect } from '@webapp/components/hooks'

import { useI18n } from '@webapp/store/system'

import { useActivityLog, ActivityLogMessage } from './store'

import Message from './Message'

const ActivityLog = () => {
  const i18n = useI18n()

  const { messages, onGetActivityLogMessagesNext } = useActivityLog()
  const [setNextActivitiesFetchTrigger] = useOnIntersect(onGetActivityLogMessagesNext)

  return (
    <div className="activity-log">
      <div className="activity-log__header">{i18n.t('activityLogView.recentActivity')}</div>

      <div className="activity-log__messages">
        {messages.map((message, index) => {
          const setRef = (el) => (index === R.length(messages) - 10 ? setNextActivitiesFetchTrigger(el) : null)

          return <Message setRef={setRef} key={ActivityLogMessage.getId(message) || String(index)} message={message} />
        })}
      </div>
    </div>
  )
}

export default ActivityLog
