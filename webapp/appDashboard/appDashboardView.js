import './style.scss'

import React from 'react'
import { withRouter } from 'react-router'

import SurveyDashboardView from '../survey/surveyDashboardView'
import SurveyDesignerDashboardView from '../appModules/surveyDesigner/surveyDesignerDashboardView'
import DataExplorerDashboardView from '../appModules/dataExplorer/dataExplorerDashboardView'
import DataAnalysisDashboardView from '../appModules/dataAnalysis/dataAnalysisDashboardView'
import UsersDashboardView from '../appModules/users/usersDashboardView'

const AppDashboardView = (props) => (

  <div className="app-dashboard">

    <SurveyDashboardView {...props}/>

    <div className="app-dashboard__modules">

      <SurveyDesignerDashboardView {...props}/>

      <DataExplorerDashboardView {...props}/>

      <DataAnalysisDashboardView {...props}/>

      <UsersDashboardView {...props}/>

    </div>

  </div>

)

export default withRouter(AppDashboardView)