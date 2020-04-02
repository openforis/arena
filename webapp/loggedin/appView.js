import './appView.scss'

import React from 'react'

import AppHeader from './appHeader/appHeader'
import AppSideBar from './appSideBar/appSideBar'
import AppJobMonitor from './appJob/appJobMonitor'
import AppErrors from '../app/appErrors/appErrors'
import LoggedInModuleSwitch from './modules/loggedInModuleSwitch'

const AppView = (props) => {
  const { location } = props
  const pathName = location.pathname

  return (
    <>
      <AppHeader />

      <div className="app__container">
        <AppSideBar pathname={pathName} />
        <LoggedInModuleSwitch location={location} />
      </div>

      <AppJobMonitor />
      <AppErrors />
    </>
  )
}

export default AppView
