import './style.scss'

import React from 'react'
import SurveyDashboardView from '../survey/surveyDashboardView'

const AppView = (props) =>
  <div className="app__container">

    <SurveyDashboardView {...props} />

  </div>

export default AppView