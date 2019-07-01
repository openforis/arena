import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Switch, Route } from 'react-router-dom'

import { Authenticator, SignIn } from 'aws-amplify-react/dist/Auth'

import LoginView from '../login/loginView'
import DynamicImport from '../commonComponents/dynamicImport'

import WebSocketEvents from '../../common/webSocket/webSocketEvents'
import * as AppWebSocket from './appWebSocket'

import * as AppState from './appState'
import { throwSystemError, initApp } from './actions'

const loginUri = '/'

const AppRouterSwitch = props => {

  const openWebSocket = () => {
    const { throwSystemError } = props

    AppWebSocket.openSocket()

    const throwError = (error) => {
      throwSystemError(error)
      closeWebSocket()
    }

    AppWebSocket.on(WebSocketEvents.connectError, error => throwError(error.stack))
    AppWebSocket.on(WebSocketEvents.error, throwError)
  }

  const closeWebSocket = () => {
    AppWebSocket.closeSocket()
  }

  const { isReady, systemError, initApp, user } = props

  useEffect(() => {
    initApp()
    return () => closeWebSocket()
  }, [])

  useEffect(() => {
    if (user === null) {
      // Before sending  get request in app/actions/initApp has been sent, user is
      // undefined, after the request is null if not logged in
      props.history.push(loginUri)
      closeWebSocket()
    } else {
      openWebSocket()
    }
  }, [user])

  return (
    isReady && (
      systemError
        ? (
          <div className="main__system-error">
            <div className="main__system-error-container">
              <span className="icon icon-warning icon-24px icon-left"/>
              Oooops! Something went wrong. Try to refresh the page.
              <div className="error">{systemError}</div>
            </div>
          </div>
        )
        : (
          <Authenticator hide={[SignIn]} hideDefault={true}>
            <LoginView override={'SignIn'}/>
            <Switch>
              {/*<Route*/}
              {/*  exact path="/"*/}
              {/*  component={LoginView}*/}
              {/*/>*/}
              <Route
                path="/app"
                render={props => (
                  <DynamicImport {...props} load={() => import('../loggedin/appViewExport')}/>
                )}
              />
            </Switch>
          </Authenticator>
        )
    )
  )
}

const mapStateToProps = state => ({
  isReady: AppState.isReady(state),
  user: AppState.getUser(state),
  systemError: AppState.getSystemError(state),
})

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    { initApp, throwSystemError }
  )
)

export default enhance(AppRouterSwitch)