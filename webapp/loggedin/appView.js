import './appView.scss'

import React from 'react'

import AppSideBar from './appSideBar/appSideBar'
import AppJobMonitor from './appJob/appJobMonitor'
import AppErrors from './appErrors/appErrors'
import ModuleSwitch from './modules/moduleSwitch'

const AppView = (props) => {
  const pathName = props.history.location.pathname

  return (
    <div className="app__container">

      <AppSideBar pathname={pathName}/>

      <ModuleSwitch location={props.location}/>

      <AppJobMonitor/>

      <AppErrors/>

    </div>
  )
}

export default AppView