import './style.scss'

import React from 'react'
import { withRouter } from 'react-router'

import SurveyInfoView from './surveyInfoView'
import SurveyDesignerDashboardView from '../surveyDesigner/surveyDesignerDashboardView'
import DataExplorerDashboardView from '../dataExplorer/dataExplorerDashboardView'
import DataAnalysisDashboardView from '../dataAnalysis/dataAnalysisDashboardView'
import UsersDashboardView from '../users/usersDashboardView'

const SurveyDashboardView = (props) => (

  <div className="app-dashboard">

    <SurveyInfoView {...props}/>

    <div className="app-dashboard__modules">

      <SurveyDesignerDashboardView {...props}/>

      <DataExplorerDashboardView {...props}/>

      <DataAnalysisDashboardView {...props}/>

      <UsersDashboardView {...props}/>

    </div>

  </div>

)

export default withRouter(SurveyDashboardView)