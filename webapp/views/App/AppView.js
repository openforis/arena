import './AppView.scss'

import React, { useEffect } from 'react'
import { useLocation, Route, Routes } from 'react-router'

import { appModuleUri, appModules } from '@webapp/app/appModules'
import { AppReducer, AppState } from '@webapp/store/app'

import Header from './Header'
import JobMonitor from './JobMonitor'
import ServiceErrors from './ServiceErrors'
import SideBar from './SideBar'
import Analysis from './views/Analysis'
import Data from './views/Data'
import Designer from './views/Designer'
import Home from './views/Home'
import Users from './views/Users'
import { injectReducers } from '@webapp/store'

const AppView = () => {
  const location = useLocation()

  useEffect(() => {
    injectReducers(AppState.stateKey, AppReducer)
  }, [])

  return (
    <>
      <Header />

      <div className="app__container">
        <SideBar />
        <div className="app-module">
          <Routes>
            <Route path={`${appModules.home.path}/*`} element={<Home />} />
            <Route path={`${appModules.designer.path}/*`} element={<Designer />} />
            <Route path={`${appModules.data.path}/*`} element={<Data />} />
            <Route path={`${appModules.users.path}/*`} element={<Users />} />
            <Route path={`${appModules.analysis.path}/*`} element={<Analysis />} />
          </Routes>
        </div>
      </div>

      <JobMonitor />
      <ServiceErrors />
    </>
  )
}

export default AppView
