import './dashboardView.scss'

import React from 'react'

import SurveyInfo from './surveyInfo/surveyInfo'
import RecordsSummary from './recordsSummary/recordsSummary'
import ActivityLog from './activityLog/activityLog'

const DashboardView = () => (
  <div className="home-dashboard">

    <SurveyInfo/>

    <RecordsSummary/>

    <ActivityLog/>

  </div>
)

export default DashboardView