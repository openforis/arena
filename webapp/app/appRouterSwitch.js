import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter, Switch, Route } from 'react-router-dom'

import DynamicImport from '../commonComponents/dynamicImport'
import LoginView from '../login/components/loginView'

import WebSocketEvents from '../../common/webSocket/webSocketEvents'
import * as AppWebSocket from './appWebSocket'

import * as AppState from './appState'
import { throwSystemError, initApp } from './actions'

import { getLocationPathname } from '../utils/routerUtils'

const loginUri = '/'

class AppRouterSwitch extends React.Component {

  openWebSocket () {
    const { throwSystemError } = this.props

    AppWebSocket.openSocket()

    const throwError = (error) => {
      throwSystemError(error)
      AppWebSocket.closeSocket()
    }

    AppWebSocket.on(WebSocketEvents.connectError, error => throwError(error.stack))
    AppWebSocket.on(WebSocketEvents.error, throwError)
  }

  closeWebSocket () {
    AppWebSocket.closeSocket()
  }

  componentDidMount () {
    this.props.initApp()
  }

  componentDidUpdate (prevProps) {
    const { user, history } = this.props
    const { user: prevUser } = prevProps

    if (user && !prevUser) {
      this.openWebSocket()
    } else if (prevUser && !user) {
      this.closeWebSocket()
      // logout - redirect to login page
      history.push(loginUri)
    }
  }

  componentWillUnmount () {
    this.closeWebSocket()
  }

  render () {
    const { isReady, systemError } = this.props

    const isLogin = getLocationPathname(this.props) === loginUri

    return (
      isReady
        ? (
          <React.Fragment>

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
                  <Switch>
                    <Route
                      exact path="/"
                      component={LoginView}
                    />
                    <Route
                      path="/app"
                      render={props => (
                        <DynamicImport {...props} load={() => import('../loggedin/appViewExport')}/>
                      )}
                    />
                  </Switch>
                )
            }

          </React.Fragment>
        )
        : (
          null
        )
    )
  }
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
