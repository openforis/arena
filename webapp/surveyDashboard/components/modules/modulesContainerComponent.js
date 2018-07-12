import React from 'react'

import SurveyDesignerComponent from './surveyDesignerComponent'
import DataExplorerComponent from './dataExplorerComponent'
import DataAnalysisComponent from './dataAnalysisComponent'
import UsersComponent from './usersComponent'

const ModulesContainerComponent = () => (
  <div className="survey-modules">

    <SurveyDesignerComponent/>

    <DataExplorerComponent/>

    <DataAnalysisComponent/>

    <UsersComponent/>

  </div>
)

export default ModulesContainerComponent