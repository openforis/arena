import './AppView.scss'

import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router'

import { app, appModules, appModuleUri } from '@webapp/app/appModules'
import { AppReducer, AppState } from '@webapp/store/app'
import { injectReducers } from '@webapp/store'
import { useIsInRoute } from '@webapp/components/hooks'

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
  const navigate = useNavigate()
  const isInRootPath = useIsInRoute(`/${app}/`)

  useEffect(() => {
    injectReducers(AppState.stateKey, AppReducer)
  }, [])

  // if is in root path (/app) redirect to /app/home
  useEffect(() => {
    if (isInRootPath) {
      // redirect to default url
      navigate(appModuleUri(appModules.home), { replace: true })
    }
  }, [isInRootPath])

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
