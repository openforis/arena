import './style.scss'

import React from 'react'

import SurveyComponent from './components/surveyComponent'
import ModulesContainerComponent from './components/modules/modulesContainerComponent'

const SurveyDashboardView = () => (
  <div className="survey-dashboard">

    <SurveyComponent/>

    <ModulesContainerComponent/>

  </div>
)

export default SurveyDashboardView