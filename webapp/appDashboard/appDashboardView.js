import './style.scss'

import React from 'react'

import SurveyDashboardView from '../survey/surveyDashboardView'
import SurveyDesignerDashboardView from '../appModules/surveyDesigner/surveyDesignerDashboardView'
import DataExplorerDashboardView from '../appModules/dataExplorer/dataExplorerDashboardView'
import DataAnalysisDashboardView from '../appModules/dataAnalysis/dataAnalysisDashboardView'
import UsersDashboardView from '../appModules/users/usersDashboardView'

const AppDashboardView = () => (
  <div className="app-dashboard">

    <SurveyDashboardView/>

    <div className="app-dashboard__modules">

      <SurveyDesignerDashboardView/>

      <DataExplorerDashboardView/>

      <DataAnalysisDashboardView/>

      <UsersDashboardView/>

    </div>

  </div>
)

export default AppDashboardView