import React from 'react'
import { Route, Switch, useLocation } from 'react-router'

import { appModules, appModuleUri } from '@webapp/app/appModules'

import Designer from '@webapp/views/Designer'
import Users from '@webapp/views/Users'
import Data from '@webapp/views/Data'
import Analysis from '@webapp/views/Analysis'
import Home from '@webapp/views/Home'

const LoggedInModuleSwitch = () => {
  const location = useLocation()
  return (
    <div className="app-module">
      <Switch location={location}>
        <Route path={appModuleUri(appModules.home)} component={Home} />
        <Route path={appModuleUri(appModules.designer)} component={Designer} />
        <Route path={appModuleUri(appModules.data)} component={Data} />
        <Route path={appModuleUri(appModules.users)} component={Users} />
        <Route path={appModuleUri(appModules.analysis)} component={Analysis} />
      </Switch>
    </div>
  )
}

export default LoggedInModuleSwitch
