import './activityLogView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import ProfilePicture from '@webapp/commonComponents/profilePicture'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import Markdown from '@webapp/commonComponents/markdown'
import { fetchActivityLogs, resetActivityLogs } from './actions'
import * as ActivityLogMessage from './activityLogMessage'

const ActivityLogView = props => {
  const { activityLogMessages, fetchActivityLogs } = props

  const i18n = useI18n()

  useEffect(() => {
    fetchActivityLogs()

    return () => {
      resetActivityLogs()
    }
  }, [])

  return (
    <div className="activity-log">
      <div className="activity-log__header">
        {i18n.t('activityLogView.recentActivity')}
      </div>

      <div className="activity-log__messages">
        {R.isEmpty(activityLogMessages)
          ? null
          : activityLogMessages.map(message => (
              <div key={ActivityLogMessage.getId(message)}>
                <div
                  className={`activity-log__message${
                    ActivityLogMessage.isItemDeleted(message)
                      ? ' item-deleted'
                      : ''
                  }`}
                >
                  <div className="activity">
                    <ProfilePicture
                      userUuid={ActivityLogMessage.getUserUuid(message)}
                      thumbnail={true}
                    />
                    <Markdown
                      source={`${ActivityLogMessage.getUserName(
                        message,
                      )} ${ActivityLogMessage.getMessage(message)}`}
                    />
                  </div>
                  <div className="date">
                    {DateUtils.getRelativeDate(
                      i18n,
                      ActivityLogMessage.getDateCreated(message),
                    )}
                  </div>
                </div>
                <div className="activity-log__message-separator" />
              </div>
            ))}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  surveyId: SurveyState.getSurveyId(state),
  activityLogMessages: ActivityLogState.getState(state),
})

export default connect(mapStateToProps, {
  fetchActivityLogs,
  resetActivityLogs,
})(ActivityLogView)
