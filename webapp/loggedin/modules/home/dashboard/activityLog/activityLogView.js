import './activityLogView.scss'

import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'

import * as ActivityLogMessage from './activityLogMessage'

import { useI18n } from '@webapp/commonComponents/hooks'
import ProfilePicture from '@webapp/commonComponents/profilePicture'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import { fetchActivityLogs, fetchActivityLogsNext, resetActivityLogs } from './actions'
import Markdown from '@webapp/commonComponents/markdown'

const ActivityLogView = props => {

  const { activityLogMessages, fetchActivityLogs, fetchActivityLogsNext } = props

  const i18n = useI18n()

  const fetchTriggerRef = useRef(null)

  useEffect(() => {
    // fetch activities on mount
    fetchActivityLogs()

    // fetch new activities with polling (every 5 seconds)
    const pollingInterval = setInterval(fetchActivityLogs, 5000)

    // fetch new activities when last ones enters into view port
    const observer = new IntersectionObserver(
      () => fetchActivityLogsNext(),
      {
        root: document.querySelector('.activity-log__messages'),
        rootMargin: '0px',
        threshold: 1.0
      }
    )

    const fetchTriggerEl = fetchTriggerRef.current
    if (fetchTriggerEl)
      observer.observe(fetchTriggerRef.current)

    return () => {
      resetActivityLogs()

      clearInterval(pollingInterval)

      observer.disconnect()
    }
  }, [R.prop('current', fetchTriggerRef)])

  return (
    <div className="activity-log">

      <div className="activity-log__header">
        {i18n.t('activityLogView.recentActivity')}
      </div>

      <div className="activity-log__messages">
        {
          R.isEmpty(activityLogMessages)
            ? null
            : activityLogMessages.map((message, index) => (
              <div key={ActivityLogMessage.getId(message)}>
                <div
                  className={`activity-log__message${ActivityLogMessage.isItemDeleted(message) ? ' item-deleted' : ''}`} 
                  ref={index > activityLogMessages.length - 10 ? fetchTriggerRef : null}>
                  <div className="activity">
                    <ProfilePicture userUuid={ActivityLogMessage.getUserUuid(message)} thumbnail={true}/>
                    <Markdown source={`${ActivityLogMessage.getUserName(message)} ${ActivityLogMessage.getMessage(message)}`}/>
                  </div>
                  <div className="date">
                    {DateUtils.getRelativeDate(i18n, ActivityLogMessage.getDateCreated(message))}
                  </div>
                </div>
                <div className="activity-log__message-separator"/>
              </div>
            ))
        }
      </div>

    </div>
  )

}

const mapStateToProps = state => {
  const activityLogState = ActivityLogState.getState(state)
  
  return {
    surveyId: SurveyState.getSurveyId(state),
    activityLogMessages: ActivityLogState.getMessages(activityLogState),
  }
}

export default connect(mapStateToProps, { fetchActivityLogs, fetchActivityLogsNext, resetActivityLogs })(ActivityLogView)