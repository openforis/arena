import './style.scss'

import React from 'react'

import SurveyInfo from './components/surveyInfo'
import SurveyModules from './components/surveyModules'

const SurveyDashboardView = () => (
  <div className="survey-dashboard">

    <SurveyInfo/>

    <SurveyModules/>

  </div>
)

export default SurveyDashboardView