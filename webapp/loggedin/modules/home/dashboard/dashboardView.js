import './dashboardView.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'

import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import SurveyInfo from './surveyInfo/surveyInfo'
import RecordsSummary from './recordsSummary/recordsSummary'
import ActivityLogView from './activityLog/activityLogView'

const DashboardView = props => {
  const { canEditDef } = props

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <div className="home-dashboard">
        <SurveyInfo />

        <RecordsSummary />

        <ActivityLogView />
      </div>
    </SurveyDefsLoader>
  )
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    canEditDef: Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps)(DashboardView)
