import './activityLogView.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'

import { useI18n, useOnIntersect, useInterval } from '@webapp/commonComponents/hooks'
import ProfilePicture from '@webapp/commonComponents/profilePicture'

import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import Markdown from '@webapp/commonComponents/markdown'
import { fetchActivityLogsNewest, fetchActivityLogsNext, resetActivityLogs } from './actions'
import * as ActivityLogMessage from './activityLogMessage'

const ActivityLogView = () => {
  const activityLogMessages = useSelector(ActivityLogState.getMessages)
  const activityLogLoadComplete = useSelector(ActivityLogState.isLoadComplete)

  const i18n = useI18n()
  const dispatch = useDispatch()

  const [setNextActivitiesFetchTrigger] = useOnIntersect(() => dispatch(fetchActivityLogsNext()))
  useInterval(() => dispatch(fetchActivityLogsNewest()), 3000)

  useEffect(() => {
    return () => dispatch(resetActivityLogs())
  }, [])

  return (
    <div className="activity-log">
      <div className="activity-log__header">{i18n.t('activityLogView.recentActivity')}</div>

      <div className="activity-log__messages">
        {R.isEmpty(activityLogMessages)
          ? null
          : activityLogMessages.map((message, index) => {
              const className = R.pipe(
                R.when(R.always(ActivityLogMessage.isItemDeleted(message)), R.append('item-deleted')),
                R.when(R.always(ActivityLogMessage.isHighlighted(message)), R.append('highlighted')),
                R.join(' ')
              )(['activity-log__message'])

              const setRef = (el) =>
                !activityLogLoadComplete && index === R.length(activityLogMessages) - 10
                  ? setNextActivitiesFetchTrigger(el)
                  : null

              return (
                <React.Fragment key={ActivityLogMessage.getId(message)}>
                  <div ref={setRef} className={className}>
                    <div className="activity">
                      <ProfilePicture userUuid={ActivityLogMessage.getUserUuid(message)} thumbnail />
                      <Markdown
                        source={`${ActivityLogMessage.getUserName(message)} ${ActivityLogMessage.getMessage(message)}`}
                      />
                    </div>
                    <div className="date">
                      {DateUtils.getRelativeDate(i18n, ActivityLogMessage.getDateCreated(message))}
                    </div>
                  </div>
                  <div className="activity-log__message-separator" />
                </React.Fragment>
              )
            })}
      </div>
    </div>
  )
}

export default ActivityLogView
