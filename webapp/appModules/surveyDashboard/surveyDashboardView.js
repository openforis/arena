import './style.scss'

import React from 'react'
import { withRouter } from 'react-router'

import SurveyInfoDashboardView from './surveyInfoDashboardView'
import SurveyDesignerDashboardView from '../surveyDesigner/surveyDesignerDashboardView'
import DataExplorerDashboardView from '../data/dataDashboardView'
import DataAnalysisDashboardView from '../analysis/dataAnalysisDashboardView'
import UsersDashboardView from '../users/usersDashboardView'

const SurveyDashboardView = (props) => (

  <div className="app-dashboard">

    <SurveyInfoDashboardView {...props}/>

    <div className="app-dashboard__modules">

      <SurveyDesignerDashboardView {...props}/>

      <DataExplorerDashboardView {...props}/>

      <DataAnalysisDashboardView {...props}/>

      <UsersDashboardView {...props}/>

    </div>

  </div>

)

export default withRouter(SurveyDashboardView)