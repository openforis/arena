import './ActivityLog.scss'

import React from 'react'
import * as R from 'ramda'

import { LoadingBar } from '@webapp/components'
import { useOnIntersect } from '@webapp/components/hooks'

import { useActivityLog, ActivityLogMessage } from './store'
import Message from './Message'

const ActivityLog = () => {
  const { messages, onGetActivityLogMessagesNext } = useActivityLog()
  const [setNextActivitiesFetchTrigger] = useOnIntersect(onGetActivityLogMessagesNext)

  return (
    <div className="activity-log__messages">
      {messages.length === 0 && <LoadingBar />}
      {messages.map((message, index) => {
        const setRef = (el) => (index === R.length(messages) - 10 ? setNextActivitiesFetchTrigger(el) : null)

        return <Message setRef={setRef} key={ActivityLogMessage.getId(message)} message={message} />
      })}
    </div>
  )
}

export default ActivityLog
