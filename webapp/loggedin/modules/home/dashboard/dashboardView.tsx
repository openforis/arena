import './dashboardView.scss'

import React from 'react'

import SurveyInfo from './surveyInfo/surveyInfo'
import RecordsSummary from './recordsSummary/recordsSummary'

const DashboardView = () => (
  <div className="home-dashboard">

    <SurveyInfo/>

    <div/>

    <RecordsSummary/>

  </div>
)

export default DashboardView