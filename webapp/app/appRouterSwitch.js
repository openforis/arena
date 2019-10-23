import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Route } from 'react-router-dom'

import User from '../../core/user/user'

import DynamicImport from '../commonComponents/dynamicImport'
import LoginView from '../login/loginView'
import AppLoaderView from './appLoader/appLoaderView'
import AppNotificationView from './appNotification/appNotificationView'

import { useOnUpdate } from '../commonComponents/hooks'

import * as AppWebSocket from './appWebSocket'
import WebSocketEvents from '../../common/webSocket/webSocketEvents'

import AppContext from './appContext'

import * as AppState from './appState'

import { initApp, throwSystemError } from './actions'
import { activeJobUpdate } from '../loggedin/appJob/actions'

const AppRouterSwitch = props => {

  const {
    isReady, systemError, user,
    initApp, throwSystemError, activeJobUpdate,
    i18n
  } = props

  const openSocket = () => {
    (async () => {
      await AppWebSocket.openSocket(throwSystemError)
      AppWebSocket.on(WebSocketEvents.jobUpdate, activeJobUpdate)
    })()
  }

  const closeSocket = () => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate)
  }

  useEffect(() => {
    initApp()
    return closeSocket
  }, [])

  useOnUpdate(() => {
    if (isReady) {
      if (user) {
        openSocket()
      } else {
        closeSocket()
      }
    }
  }, [isReady, User.getUuid(user)])

  return systemError
    ? (
      <div className="main__system-error">
        <div className="main__system-error-container">
          <span className="icon icon-warning icon-24px icon-left"/>
          {i18n.t('systemErrors.somethingWentWrong')}
          <div className="error">{systemError}</div>
        </div>
      </div>
    )
    : isReady &&
    (
      <AppContext.Provider value={{ i18n }}>

        {
          user
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
        }

        <AppLoaderView/>
        <AppNotificationView/>

      </AppContext.Provider>
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
    { initApp, throwSystemError, activeJobUpdate }
  )
)

export default enhance(AppRouterSwitch)