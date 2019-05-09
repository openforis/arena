import './appView.scss'

import React from 'react'
import { connect } from 'react-redux'

import { I18nContext } from '../i18n/i18nContext'

import * as AppState from '../app/appState'

import AppSideBar from './appSideBar/appSideBar'
import AppJobMonitor from './appJob/appJobMonitor'
import AppErrors from './appErrors/appErrors'
import ModuleSwitch from './modules/moduleSwitch'

class AppView extends React.Component {
  render () {
    const pathName = this.props.history.location.pathname

    return (
      <I18nContext.Provider value={this.props.i18n}>
        <div className="app__container">

          <AppSideBar pathname={pathName}/>

          <ModuleSwitch location={this.props.location}/>

          <AppJobMonitor/>

          <AppErrors/>

        </div>
      </I18nContext.Provider>
    )
  }
}

const mapStateToProps = (state) => {
  return { i18n: AppState.getState(state).i18n } // TODO - add function to appState
}

export default connect(
  mapStateToProps
)(AppView)