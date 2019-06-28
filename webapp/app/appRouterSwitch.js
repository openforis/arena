import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import { withRouter, Switch, Route } from 'react-router-dom'

import DynamicImport from '../commonComponents/dynamicImport'
import LoginView from '../login/components/loginView'

import WebSocketEvents from '../../common/webSocket/webSocketEvents'
import * as AppWebSocket from './appWebSocket'

import * as AppState from './appState'
import { throwSystemError, initApp } from './actions'

import { getLocationPathname } from '../utils/routerUtils'

import { Authenticator } from 'aws-amplify-react/dist/Auth'
import CustomSignIn from '../login/components/customSignIn'

// import { appModuleUri } from '../loggedin/appModules'

const loginUri = '/'

const AppRouterSwitch = props => {

  const openWebSocket = () => {
    const { throwSystemError } = props

    AppWebSocket.openSocket()

    const throwError = (error) => {
      throwSystemError(error)
      AppWebSocket.closeSocket()
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
    if (user) {
      openWebSocket()
    } else {
      closeWebSocket()
      props.history.push(loginUri)
    }
  }, [user])

  const isLogin = getLocationPathname(props) === loginUri

  return (
    isReady && (
      <React.Fragment>

        <div className={`main__bg1${isLogin ? ' login' : ''}`}/>
        <div className={`main__bg2${isLogin ? ' login' : ''}`}/>
        <div className="main__bg-overlay"/>

        {
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
              <Authenticator hideDefault={true}>
                <CustomSignIn override={'SignIn'}/>
                {/* <AppView location="props.history.location" history={props.history} /> */}
                {/* <Redirect to={appModuleUri()} /> */}
                <Switch>
                  {/* <Route
                    exact path="/"
                    component={LoginView}
                  /> */}
                  <Route
                    path="/app"
                    render={props => (
                      <DynamicImport {...props} load={() => import('../loggedin/appViewExport')}/>
                    )}
                  />
                </Switch>
              </Authenticator>
            )
        }

      </React.Fragment>
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