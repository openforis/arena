import '../style.scss'

import React from 'react'
import { TransitionGroup } from 'react-transition-group'

import ModuleViewTransitionComponent from './moduleViewTransitionComponent'

import { appModules } from '../appModules'
import { getLocationPathname } from '../../appUtils/routerUtils'

import AppHomeView from '../home/appHomeView'
import SurveyDashboardView from '../surveyDashboard/surveyDashboardView'
import DataExplorerView from '../dataExplorer/dataExplorerView'
import SurveyDesignerView from '../surveyDesigner/surveyDesignerView'

const appModulesComponents = {
  [appModules.home]: AppHomeView,
  [appModules.surveyDashboard]: SurveyDashboardView,
  [appModules.surveyDesigner]: SurveyDesignerView,
  [appModules.dataExplorer]: DataExplorerView,
}

const AppModule = ({module, ...props}) => (

  <ModuleViewTransitionComponent pathname={getLocationPathname(props)}
                                 component={appModulesComponents[module]}
                                 module={module}
  />
)

const AppModulesView = (props) => (
  <div className="app__modules">

    <TransitionGroup component={null}>

      <AppModule module={appModules.home} {...props}/>
      <AppModule module={appModules.surveyDashboard} {...props}/>
      <AppModule module={appModules.surveyDesigner} {...props}/>
      <AppModule module={appModules.dataExplorer} {...props}/>

    </TransitionGroup>
  </div>
)

export default AppModulesView