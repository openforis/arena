import './style.scss'

import React from 'react'

import AppHeader from './components/appHeader'
import SurveyDashboardView from '../surveyDashboard/surveyDashboardView'

const AppView = (props) =>
  <div className="app__container">

    <AppHeader/>
    <SurveyDashboardView {...props} />

  </div>

export default AppView