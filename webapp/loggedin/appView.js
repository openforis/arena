import './appView.scss'

import React from 'react'
import { connect } from 'react-redux'

import AppContext from '../app/appContext'

import * as AppState from '../app/appState'

import AppSideBar from './appSideBar/appSideBar'
import AppJobMonitor from './appJob/appJobMonitor'
import AppErrors from './appErrors/appErrors'
import ModuleSwitch from './modules/moduleSwitch'

class AppView extends React.Component {
  render () {
    const { location, i18n, authState } = this.props

    // if (authState === 'signedIn') {
      const pathName = this.props.history.location.pathname

      return (
        <div className="app__container">
          <AppContext.Provider value={{ i18n }}>

            <AppSideBar pathname={pathName}/>

            <ModuleSwitch location={location}/>

            <AppJobMonitor/>

            <AppErrors/>

          </AppContext.Provider>

        </div>
      )
    // } else {
    //   return null
    // }
  }
}

const mapStateToProps = (state) => {
  return { i18n: AppState.getI18n(state) }
}

export default connect(
  mapStateToProps
)(AppView)