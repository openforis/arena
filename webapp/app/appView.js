import './style.scss'

import React from 'react'

import AppHeader from './components/appHeader'
import SurveyDashboardView from '../surveyDashboard/surveyDashboardView'

const AppView = (props) =>
  <div className="app__container">

    <AppHeader {...props} />
    <SurveyDashboardView {...props} />

  </div>

export default AppView