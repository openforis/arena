import React from 'react'
import { Route, Switch } from 'react-router'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import DataRecordView from '../../data/records/record'
import DesignerView from '../../designer/designerView'
import HomeView from '../../home/appHomeView'
import DashboardView from '../../dashboard/dashboardView'
import DataView from '../../data/dataView'

import { appModules, appModuleUri } from '../../appModules'

const AppModuleHOC = Component => props => (
  <div className="app-module">
    <Component {...props}/>
  </div>
)
const Home = AppModuleHOC(HomeView)
const Dashboard = AppModuleHOC(DashboardView)
const Designer = AppModuleHOC(DesignerView)
const Data = AppModuleHOC(DataView)
const DataRecord = AppModuleHOC(DataRecordView)

const AppModuleSwitch = (props) => (
  <TransitionGroup className="app__modules">
    <CSSTransition
      // avoid css transition when changing location within subroutes
      key={props.location.pathname.split('/')[2]}
      timeout={150}
      classNames="app-module__fade">

      <Switch location={props.location}>
        <Route path={appModuleUri(appModules.home)} component={Home}/>
        <Route path={appModuleUri(appModules.dashboard)} component={Dashboard}/>
        <Route path={appModuleUri(appModules.designer)} component={Designer}/>
        <Route exact path={appModuleUri(appModules.data)} component={Data}/>
        <Route exact path={appModuleUri(appModules.dataRecord)} component={DataRecord}/>
      </Switch>

    </CSSTransition>
  </TransitionGroup>
)

export default AppModuleSwitch