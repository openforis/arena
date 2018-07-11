import './style.scss'

import React from 'react'
import SurveyDashboardView from '../surveyDashboard/surveyDashboardView'

const AppView = (props) =>
  <div className="app__container">

    <SurveyDashboardView {...props} />

  </div>

export default AppView