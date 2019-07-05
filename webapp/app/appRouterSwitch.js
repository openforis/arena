import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Switch, Route, Redirect } from 'react-router-dom'

import { Authenticator, SignIn } from 'aws-amplify-react/dist/Auth'

import LoginView from '../login/loginView'
import DynamicImport from '../commonComponents/dynamicImport'

import * as AppWebSocket from './appWebSocket'

import * as AppState from './appState'
import { throwSystemError, initApp } from './actions'

import { appModuleUri } from '../loggedin/appModules'

const AppSwitch = ({ authState }) => (
  authState === 'signedIn' &&
  <Switch>
    <Route
      exact
      path="/"
      render={() => (
        <Redirect to={appModuleUri()}/>
      )}
    />
    <Route
      path="/app"
      render={props => (
        <DynamicImport {...props} load={() => import('../loggedin/appViewExport')}/>
      )}
    />
  </Switch>
)

const AppRouterSwitch = props => {

  const {
    isReady, systemError, user,
    initApp, throwSystemError,
  } = props

  useEffect(() => {
    initApp()
    return () => AppWebSocket.closeSocket()
  }, [])

  useEffect(() => {
    if (user) {
      (async () => {
        await AppWebSocket.openSocket(throwSystemError)
      })()
    } else {
      AppWebSocket.closeSocket()
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
            <AppSwitch/>
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