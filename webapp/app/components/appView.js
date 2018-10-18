import '../style.scss'

import React from 'react'

import AppSideBar from './sideBar/appSideBar'
import AppModulesView from '../../appModules/components/appModulesView'
import AppJobMonitor from './job/appJobMonitor'

const AppView = (props) => (
  <div className="app__container">

    <AppSideBar {...props} />

    <AppModulesView {...props} />

    <AppJobMonitor/>

  </div>
)

export default AppView