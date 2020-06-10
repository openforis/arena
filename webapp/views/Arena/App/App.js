import './App.scss'

import React from 'react'
import { useLocation } from 'react-router'

import AppHeader from './appHeader/appHeader'
import AppSideBar from './appSideBar/appSideBar'
import AppJobMonitor from './appJob/appJobMonitor'
import AppErrors from '../app/appErrors/appErrors'
import LoggedInModuleSwitch from './modules/loggedInModuleSwitch'

const AppView = () => {
  const location = useLocation()

  return (
    <>
      <AppHeader />

      <div className="app__container">
        <AppSideBar />
        <LoggedInModuleSwitch location={location} />
      </div>

      <AppJobMonitor />
      <AppErrors />
    </>
  )
}

export default AppView
