import './activityLogView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Authorizer from '@core/auth/authorizer'
import DateUtils from '@core/dateUtils'

import * as ActivityLog from '@common/activityLog/activityLog'

import { useI18n } from '@webapp/commonComponents/hooks'
import ProfilePicture from '@webapp/commonComponents/profilePicture'

import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import * as SurveyState from '@webapp/survey/surveyState'
import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import { fetchActivityLogs, resetActivityLogs } from './actions'
import * as AppState from '@webapp/app/appState'

const ActivityLogView = props => {

  const {
    activityLogs,
    canEditDef,
    fetchActivityLogs
  } = props

  const i18n = useI18n()

  useEffect(() => {
    fetchActivityLogs()

    return () => {
      resetActivityLogs()
    }
  }, [])

  return (
    <SurveyDefsLoader
      draft={canEditDef}
      validate={canEditDef}>

      <div className="activity-log">

        <div className="activity-log__header">
          {i18n.t('activityLogView.recentActivity')}
        </div>

        <div className="activity-log__content">
          {R.isEmpty(activityLogs)
            ? null
            : activityLogs.map(activityLog => (
              <div key={ActivityLog.getId(activityLog)}>
                <div
                  className="activity-log__content-item">
                  <div className="activity">
                    <ProfilePicture userUuid={ActivityLog.getUserUuid(activityLog)} thumbnail={true}/>
                    {`${ActivityLog.getUserName(activityLog)} ${activityLog.message}`}
                  </div>
                  <div className="date">
                    {DateUtils.getRelativeDate(i18n, ActivityLog.getDateCreated(activityLog))}
                  </div>
                </div>
                <div className="activity-log__content-item-sep"/>
              </div>
            ))
          }
        </div>

      </div>
    </SurveyDefsLoader>
  )

}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    surveyId: SurveyState.getSurveyId(state),
    activityLogs: ActivityLogState.getState(state),
    canEditDef: Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps, { fetchActivityLogs, resetActivityLogs })(ActivityLogView)