import './style.scss'

import React from 'react'

import AppSideBar from './components/sideBar/appSideBar'
import AppModulesView from '../appModules/appModulesView'
import AppJobMonitor from './components/job/appJobMonitor'
import AppErrors from './components/errors/appErrors'

const AppView = (props) => (
  <div className="app__container">

    <AppSideBar {...props} />

    <AppModulesView {...props} />

    <AppJobMonitor/>

    <AppErrors/>

  </div>
)

export default AppView