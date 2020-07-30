import './App.scss'

import React from 'react'
import { useLocation, Route, Switch } from 'react-router'

import { appModuleUri, appModules } from '@webapp/app/appModules'

import Header from './Header'
import JobMonitor from './JobMonitor'
import ServiceErrors from './ServiceErrors'
import SideBar from './SideBar'
import Analysis from './views/Analysis'
import Data from './views/Data'
import Designer from './views/Designer'
import Home from './views/Home'
import Users from './views/Users'

const AppView = () => {
  const location = useLocation()

  return (
    <>
      <Header />

      <div className="app__container">
        <SideBar />
        <div className="app-module">
          <Switch location={location}>
            <Route path={appModuleUri(appModules.home)} component={Home} />
            <Route path={appModuleUri(appModules.designer)} component={Designer} />
            <Route path={appModuleUri(appModules.data)} component={Data} />
            <Route path={appModuleUri(appModules.users)} component={Users} />
            <Route path={appModuleUri(appModules.analysis)} component={Analysis} />
          </Switch>
        </div>
      </div>

      <JobMonitor />
      <ServiceErrors />
    </>
  )
}

export default AppView
