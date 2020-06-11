import './App.scss'

import React from 'react'
import { useLocation } from 'react-router'

import LoggedInModuleSwitch from '@webapp/loggedin/modules/loggedInModuleSwitch'

import Header from './Header'
import SideBar from './SideBar'
import JobMonitor from './JobMonitor'
import ServiceErrors from './ServiceErrors'

const AppView = () => {
  const location = useLocation()

  return (
    <>
      <Header />

      <div className="app__container">
        <SideBar />
        <LoggedInModuleSwitch location={location} />
      </div>

      <JobMonitor />
      <ServiceErrors />
    </>
  )
}

export default AppView
