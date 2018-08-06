import '../style.scss'

import React from 'react'

import AppSideBar from './sideBar/appSideBar'
import AppModulesView from '../../appModules/appModulesView'

const AppView = (props) => (

  <div className="app__container">

    <AppSideBar {...props} />

    <AppModulesView {...props} />

  </div>
)

export default AppView