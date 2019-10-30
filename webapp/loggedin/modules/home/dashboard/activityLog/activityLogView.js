import './activityLogView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import DateUtils from '@core/dateUtils'

import * as ActivityLog from '@common/activityLog/activityLog'

import { useAsyncGetRequest, useI18n } from '../../../../../commonComponents/hooks'
import ProfilePicture from '../../../../../commonComponents/profilePicture'

import * as AppState from '../../../../../app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

const ActivityLogView = props => {

  const { surveyId } = props

  const i18n = useI18n()

  const { data: { activityLogs = [] } = { activityLog: [] }, dispatch: fetchActivityLogs, setState: setActivityLogs } = useAsyncGetRequest(
    `/api/survey/${surveyId}/activity-log`,
    { params: { offset: 0, limit: 30 } }
  )

  useEffect(() => {
    fetchActivityLogs()
  }, [])

  return (
    <div className="activity-log">

      <div className="activity-log__header">
        {i18n.t('homeView.activityLog.recentActivity')}
      </div>

      <div className="activity-log__content">
        {
          activityLogs.map(activityLog => (
            <>
              <div className="activity-log__content-item">
                <div className="activity">
                  <ProfilePicture userUuid={ActivityLog.getUserUuid(activityLog)} thumbnail={true}/>
                  {`${ActivityLog.getUserName(activityLog)} ${i18n.t(`activityLogView.message.${ActivityLog.getType(activityLog)}`, { ...ActivityLog.getContent(activityLog) })}`}
                </div>
                <div className="date">
                  {DateUtils.getRelativeDate(i18n, ActivityLog.getDateCreated(activityLog))}
                </div>
              </div>
              <div className="activity-log__content-item-sep"/>
            </>
          ))
        }
      </div>

    </div>
  )

}

const mapStateToProps = state => ({
  surveyId: SurveyState.getSurveyId(state),
})

export default connect(mapStateToProps)(ActivityLogView)