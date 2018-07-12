import './style.scss'

import React from 'react'

import SurveyComponent from './components/survey/surveyComponent'
import SurveyModulesComponent from './components/surveyModulesComponent'

const SurveyDashboardView = () => (
  <div className="survey-dashboard">

    <SurveyComponent/>

    <SurveyModulesComponent/>

  </div>
)

export default SurveyDashboardView