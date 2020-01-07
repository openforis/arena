import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Route } from 'react-router-dom'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { isGuestUri } from '@webapp/app/appModules'
import * as AppWebSocket from './appWebSocket'

import * as User from '@core/user/user'

import DynamicImport from '@webapp/commonComponents/dynamicImport'
import LoginView from '@webapp/guest/login/loginView'
import AppLoaderView from './appLoader/appLoaderView'
import AppNotificationView from './appNotification/appNotificationView'
import GuestView from '@webapp/guest/guestView'
import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'

import * as AppState from './appState'

import { initApp, throwSystemError } from './actions'
import { activeJobUpdate } from '@webapp/loggedin/appJob/actions'

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
        {user && User.hasAccepted(user) ? (
          <Route
            path="/app"
            render={props => <DynamicImport {...props} load={() => import('@webapp/loggedin/appViewExport')} />}
          />
        ) : isGuestUri(location.pathname) ? (
          <GuestView />
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
