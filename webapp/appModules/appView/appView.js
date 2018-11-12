import './appView.scss'

import React from 'react'

import AppSideBar from './components/sideBar/appSideBar'
import AppJobMonitor from './components/job/appJobMonitor'
import AppErrors from './components/errors/appErrors'
import AppModuleSwitch from './components/appModuleSwitch'

const AppView = (props) => {
  const pathName = props.history.location.pathname

  return (
    <div className="app__container">

      <AppSideBar pathname={pathName}/>

      <AppModuleSwitch location={props.location}/>

      <AppJobMonitor/>

      <AppErrors/>

    </div>
  )
}

export default AppView