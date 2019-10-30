import './dashboardView.scss'

import React from 'react'

import SurveyInfo from './surveyInfo/surveyInfo'
import RecordsSummary from './recordsSummary/recordsSummary'
import ActivityLogView from './activityLog/activityLogView'

const DashboardView = () => (
  <div className="home-dashboard">

    <SurveyInfo/>

    <RecordsSummary/>

    <ActivityLogView/>

  </div>
)

export default DashboardView