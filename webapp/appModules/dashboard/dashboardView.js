import './dashboardView.scss'

import React from 'react'
import { withRouter } from 'react-router'

import SurveyInfo from './components/surveyInfo'
import Designer from './components/designer'
import Data from './components/data'
import Analysis from './components/analysis'
import Users from './components/users'

const DashboardView = (props) => (

  <div className="app-dashboard">

    <SurveyInfo history={props.history}/>

    <div className="app-dashboard__modules">

      <Designer/>

      <Data/>

      <Analysis/>

      <Users/>

    </div>

  </div>

)

export default withRouter(DashboardView)