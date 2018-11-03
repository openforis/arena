import '../style.scss'

import React from 'react'
import { Route, Switch } from 'react-router'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

// import ModuleViewTransitionComponent from './moduleViewTransitionComponent'

import { appModuleUri } from '../../app/app'
import { appModules } from '../appModules'
// import { getLocationPathname } from '../../appUtils/routerUtils'

import AppHomeView from '../home/appHomeView'
import SurveyDashboardView from '../surveyDashboard/surveyDashboardView'
import DataView from '../data/dataView'
import DataRecordView from '../data/dataRecordView'
import SurveyDesignerView from '../surveyDesigner/surveyDesignerView'

// const AppModule = ({module, component, ...props}) => (
//
//   <ModuleViewTransitionComponent pathname={getLocationPathname(props)}
//                                  component={component}
//                                  module={module}
//   />
// )
//
// const AppModulesView = (props) => (
//   <div className="app__modules">
//
//     <TransitionGroup component={null}>
//
//       <AppModule module={appModules.home} component={AppHomeView} {...props}/>
//       <AppModule module={appModules.surveyDashboard} component={SurveyDashboardView}  {...props}/>
//       <AppModule module={appModules.surveyDesigner} component={SurveyDesignerView} {...props}/>
//
//       <AppModule module={appModules.data} component={DataView}  {...props}/>
//       <AppModule module={appModules.dataRecord} component={DataRecordView}  {...props}/>
//
//     </TransitionGroup>
//   </div>
// )

const AppModuleHOC = Component => props => (
  <div className="app-module">
    <Component {...props}/>
  </div>
)
const AppModulesView = (props) => (
  <TransitionGroup className="app__modules">
    <CSSTransition
      key={props.location.key}
      timeout={200}
      classNames="app-module__fade">

      <Switch location={props.location}>
        <Route exact={true} path={appModuleUri(appModules.home)} component={AppModuleHOC(AppHomeView)}/>
        <Route exact={true} path={appModuleUri(appModules.surveyDashboard)} component={AppModuleHOC(SurveyDashboardView)}/>
        <Route exact={true} path={appModuleUri(appModules.surveyDesigner)} component={AppModuleHOC(SurveyDesignerView)}/>
        <Route exact={true} path={appModuleUri(appModules.data)} component={AppModuleHOC(DataView)}/>
        <Route exact={true} path={appModuleUri(appModules.dataRecord)} component={AppModuleHOC(DataRecordView)}/>
      </Switch>

    </CSSTransition>
  </TransitionGroup>
)

export default AppModulesView