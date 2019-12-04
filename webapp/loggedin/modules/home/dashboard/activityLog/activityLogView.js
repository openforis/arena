import './activityLogView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'

import * as ActivityLogMessage from './activityLogMessage'

import { useI18n, useIntersection } from '@webapp/commonComponents/hooks'
import ProfilePicture from '@webapp/commonComponents/profilePicture'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import { fetchActivityLogsNewest, fetchActivityLogsNext, resetActivityLogs } from './actions'
import Markdown from '@webapp/commonComponents/markdown'

const ActivityLogView = props => {

  const { 
    activityLogMessages, activityLogLoadComplete, 
    fetchActivityLogsNewest, fetchActivityLogsNext 
  } = props

  const i18n = useI18n()

  const [setIntersectionTrigger] = useIntersection(([intersectionEntry]) => {
    intersectionEntry.intersectionRatio > 0 && fetchActivityLogsNext()
  })

  useEffect(() => {
    // fetch newest activities on mount
    fetchActivityLogsNewest()

    // fetch new activities with polling (every 3 seconds)
    let timeoutPolling
    const setTimeoutPolling = () => {
      timeoutPolling = setTimeout(
        async () => {
          await fetchActivityLogsNewest()
          setTimeoutPolling()
        }, 
        3000
      )
    }
    setTimeoutPolling()

    return () => {
      resetActivityLogs()

      clearTimeout(timeoutPolling)
    }
  }, [])

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
                  ref={el => (!activityLogLoadComplete) && index === activityLogMessages.length - 10 ? setIntersectionTrigger(el) : null}>
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
    activityLogLoadComplete: ActivityLogState.isLoadComplete(activityLogState),
  }
}

export default connect(mapStateToProps, { fetchActivityLogsNewest, fetchActivityLogsNext, resetActivityLogs })(ActivityLogView)