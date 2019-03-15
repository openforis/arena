import './appView.scss'

import React from 'react'

import AppSideBar from './components/sideBar/appSideBar'
import AppJobMonitor from './components/job/appJobMonitor'
import AppErrors from './components/errors/appErrors'
import ModuleSwitch from '../components/moduleSwitch'

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