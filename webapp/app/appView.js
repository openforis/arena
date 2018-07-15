import './style.scss'

import React from 'react'

import AppHeader from './components/appHeader'
import AppModulesView from '../appModules/appModulesView'

const AppView = (props) => (

  <div className="app__container">

    <AppHeader {...props} />

    <AppModulesView {...props} />

  </div>
)

export default AppView