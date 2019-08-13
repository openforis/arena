import React from 'react'
import { Route, Switch } from 'react-router'

import DesignerView from './designer/designerView'
import HomeView from './home/homeView'
import DataView from './data/dataView'
import UsersView from './users/usersView'

import { appModules, appModuleUri } from '../appModules'

const ModuleSwitch = (props) => (
  <div className="app-module">

    <Switch location={props.location}>
      <Route path={appModuleUri(appModules.home)} component={HomeView}/>
      <Route path={appModuleUri(appModules.designer)} component={DesignerView}/>
      <Route path={appModuleUri(appModules.data)} component={DataView}/>
      <Route path={appModuleUri(appModules.users)} component={UsersView}/>
    </Switch>

  </div>
)

export default ModuleSwitch