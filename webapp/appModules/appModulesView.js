import './style.scss'

import React from 'react'
import { TransitionGroup } from 'react-transition-group'

import ModuleViewTransitionComponent from './components/moduleViewTransitionComponent'

import { appDashboard, appModules } from './appModules'
import { getLocationPathname } from '../app-utils/routerUtils'

import AppDashboardView from '../appDashboard/appDashboardView'
import DataExplorerView from './dataExplorer/dataExplorerView'
import SurveyDesignerView from './surveyDesigner/surveyDesignerView'

const appModulesComponents = {
  [appDashboard]: AppDashboardView,
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

      <AppModule module={appDashboard} {...props}/>
      <AppModule module={appModules.surveyDesigner} {...props}/>
      <AppModule module={appModules.dataExplorer} {...props}/>

    </TransitionGroup>
  </div>
)

export default AppModulesView