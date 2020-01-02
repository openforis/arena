import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Route } from 'react-router-dom'

import * as User from '@core/user/user'

import DynamicImport from '@webapp/commonComponents/dynamicImport'
import LoginView from '@webapp/login/loginView'
import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { activeJobUpdate } from '../loggedin/appJob/actions'
import AppLoaderView from './appLoader/appLoaderView'
import AppNotificationView from './appNotification/appNotificationView'

import * as AppWebSocket from './appWebSocket'

import * as AppState from './appState'

import { initApp, throwSystemError } from './actions'
import { isGuestUri, guestModules } from '@webapp/guest/guestModules'
import InnerModuleSwitch from '@webapp/loggedin/modules/components/innerModuleSwitch'

const AppRouterSwitch = props => {
  const { isReady, systemError, user, initApp, throwSystemError, activeJobUpdate } = props

  const i18n = useI18n()

  const openSocket = () => {
    ;(async () => {
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

  return systemError ? (
    <div className="main__system-error">
      <div className="main__system-error-container">
        <span className="icon icon-warning icon-24px icon-left" />
        {i18n.t('systemErrors.somethingWentWrong')}
        <div className="error">{systemError}</div>
      </div>
    </div>
  ) : (
    isReady && (
      <>
        {user ? (
          <Route
            path="/app"
            render={props => <DynamicImport {...props} load={() => import('@webapp/loggedin/appViewExport')} />}
          />
        ) : isGuestUri(location.pathname) ? (
          <InnerModuleSwitch modules={Object.values(guestModules)} />
        ) : (
          <LoginView />
        )}

        <AppLoaderView />
        <AppNotificationView />
      </>
    )
  )
}

const mapStateToProps = state => ({
  isReady: AppState.isReady(state),
  user: AppState.getUser(state),
  systemError: AppState.getSystemError(state),
})

const enhance = compose(withRouter, connect(mapStateToProps, { initApp, throwSystemError, activeJobUpdate }))

export default enhance(AppRouterSwitch)
