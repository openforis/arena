import '../style.scss'

import React from 'react'

import AppSideBar from './sideBar/appSideBar'
import AppModulesView from '../../appModules/components/appModulesView'
import AppJobMonitor from './job/appJobMonitor'
import AppErrors from './errors/appErrors'

const AppView = (props) => (
  <div className="app__container">

    <AppSideBar {...props} />

    <AppModulesView {...props} />

    <AppJobMonitor/>

    <AppErrors/>

  </div>
)

export default AppView