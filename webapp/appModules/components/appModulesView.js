import '../style.scss'

import React from 'react'
import { TransitionGroup } from 'react-transition-group'

import ModuleViewTransitionComponent from './moduleViewTransitionComponent'

import { appModules } from '../appModules'
import { getLocationPathname } from '../../appUtils/routerUtils'

import AppHomeView from '../home/appHomeView'
import SurveyDashboardView from '../surveyDashboard/surveyDashboardView'
import DataView from '../data/dataView'
import DataRecordView from '../data/dataRecordView'
import SurveyDesignerView from '../surveyDesigner/surveyDesignerView'

const AppModule = ({module, component, ...props}) => (

  <ModuleViewTransitionComponent pathname={getLocationPathname(props)}
                                 component={component}
                                 module={module}
  />
)

const AppModulesView = (props) => (
  <div className="app__modules">

    <TransitionGroup component={null}>

      <AppModule module={appModules.home} component={AppHomeView} {...props}/>
      <AppModule module={appModules.surveyDashboard} component={SurveyDashboardView}  {...props}/>
      <AppModule module={appModules.surveyDesigner} component={SurveyDesignerView} {...props}/>

      <AppModule module={appModules.data} component={DataView}  {...props}/>
      <AppModule module={appModules.dataRecord} component={DataRecordView}  {...props}/>

    </TransitionGroup>
  </div>
)

export default AppModulesView