import React from 'react'

import SurveyDesignerComponent from './surveyDesigner/surveyDesignerComponent'
import DataExplorerComponent from './dataExplorer/dataExplorerComponent'
import DataAnalysisComponent from './dataAnalysis/dataAnalysisComponent'
import UsersComponent from './users/usersComponent'

const SurveyModulesComponent = () => (
  <div className="survey-modules">

    <SurveyDesignerComponent/>

    <DataExplorerComponent/>

    <DataAnalysisComponent/>

    <UsersComponent/>

  </div>
)

export default SurveyModulesComponent