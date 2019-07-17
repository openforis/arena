import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Route } from 'react-router-dom'

import LoginView from '../login/loginView'
import DynamicImport from '../commonComponents/dynamicImport'
import { useOnUpdate } from '../commonComponents/hooks'

import * as AppWebSocket from './appWebSocket'

import * as AppState from './appState'
import { throwSystemError, initApp } from './actions'

const AppRouterSwitch = props => {

  const {
    isReady, systemError, user,
    initApp, throwSystemError,
    i18n
  } = props

  useEffect(() => {
    initApp()
    return AppWebSocket.closeSocket
  }, [])

  useOnUpdate(() => {
    if (isReady) {
      if (user) {
        (async () => {
          await AppWebSocket.openSocket(throwSystemError)
        })()
      } else {
        AppWebSocket.closeSocket()
      }
    }
  }, [isReady, user])

  return (
    isReady && (
      systemError
        ? (
          <div className="main__system-error">
            <div className="main__system-error-container">
              <span className="icon icon-warning icon-24px icon-left"/>
              {i18n.t('systemErrors.somethingWentWrong')}
              <div className="error">{systemError}</div>
            </div>
          </div>
        )
        : user
        ? (
          <Route
            path="/app"
            render={props => (
              <DynamicImport {...props} load={() => import('../loggedin/appViewExport')}/>
            )}
          />
        )
        : (
          <LoginView/>
        )

    )
  )
}

const mapStateToProps = state => ({
  isReady: AppState.isReady(state),
  user: AppState.getUser(state),
  systemError: AppState.getSystemError(state),
  i18n: AppState.getI18n(state),
})

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    { initApp, throwSystemError }
  )
)

export default enhance(AppRouterSwitch)