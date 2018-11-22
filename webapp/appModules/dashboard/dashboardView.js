import './dashboardView.scss'

import React from 'react'

import SurveyInfo from './components/surveyInfo'
import Designer from './components/designer'
import Data from './components/data'
import Analysis from './components/analysis'
import Users from './components/users'

const DashboardView = () => (

  <div className="app-dashboard">

    <SurveyInfo/>

    <div className="app-dashboard__modules">

      <Designer/>

      <Data/>

      <Analysis/>

      <Users/>

    </div>

  </div>

)

export default DashboardView