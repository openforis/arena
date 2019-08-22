import './appView.scss'

import React from 'react'
import { connect } from 'react-redux'

import AppContext from '../app/appContext'
import AppHeader from './appHeader/appHeader'
import AppSideBar from './appSideBar/appSideBar'
import AppJobMonitor from './appJob/appJobMonitor'
import AppErrors from './appErrors/appErrors'
import ModuleSwitch from './modules/moduleSwitch'

import * as AppState from '../app/appState'

const AppView = props => {
  const { location, i18n } = props
  const pathName = location.pathname

  return (
    <AppContext.Provider value={{ i18n }}>

      <AppHeader/>

      <div className="app__container">
        <AppSideBar pathname={pathName}/>
        <ModuleSwitch location={location}/>
      </div>

      <AppJobMonitor/>
      <AppErrors/>

    </AppContext.Provider>
  )
}

const mapStateToProps = (state) => ({
  i18n: AppState.getI18n(state)
})

export default connect(mapStateToProps)(AppView)