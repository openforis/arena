import './ActivityLog.scss'

import React from 'react'
import classNames from 'classnames'
import * as R from 'ramda'

import { useOnIntersect } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

import Message from './Message'
import { ActivityLogMessage, useActivityLog } from './store'

const ActivityLog = () => {
  const i18n = useI18n()

  const { messages, visible, onGetActivityLogMessagesNext, setVisible } = useActivityLog()
  const [setNextActivitiesFetchTrigger] = useOnIntersect(onGetActivityLogMessagesNext)

  return (
    <div className="activity-log">
      <div className="activity-log__header">
        {i18n.t('activityLogView.recentActivity')}
        <div className="display-flex">
          <button type="button" className="btn-xs btn-toggle btn-expand" onClick={() => setVisible(!visible)}>
            <span
              className={classNames('icon icon-12px', {
                'icon-shrink2': visible,
                'icon-enlarge2': !visible,
              })}
            />
          </button>
        </div>
      </div>

      {visible && (
        <div className="activity-log__messages">
          {messages.map((message, index) => {
            const setRef = (el) => (index === R.length(messages) - 10 ? setNextActivitiesFetchTrigger(el) : null)

            return <Message setRef={setRef} key={ActivityLogMessage.getId(message)} message={message} />
          })}
        </div>
      )}
    </div>
  )
}

export default ActivityLog
