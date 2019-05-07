import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Switch, Route } from 'react-router-dom'
import DynamicImport from '../commonComponents/dynamicImport'

import LoginView from '../login/components/loginView'

import { throwSystemError, initApp } from './actions'
import * as AppState from './appState'
import { getLocationPathname } from '../utils/routerUtils'

import WebSocketEvents from '../../common/webSocket/webSocketEvents'
import * as AppWebSocket from './appWebSocket'
import { recordNodesUpdate, nodeValidationsUpdate, dispatchRecordDelete } from '../loggedin/surveyViews/record/actions'

const loginUri = '/'

class AppRouterSwitch extends React.Component {

  throwSystemError (error) {
    AppWebSocket.closeSocket()
    this.props.throwSystemError(error)
  }

  componentDidMount () {
    this.props.initApp()
  }

  componentDidUpdate (prevProps) {
    const {
      user, history,
      activeJobUpdate, recordNodesUpdate, dispatchRecordDelete, nodeValidationsUpdate, throwSystemError
    } = this.props
    const { user: prevUser } = prevProps

    if (user && !prevUser) {
      AppWebSocket.openSocket({
        [WebSocketEvents.nodesUpdate]: recordNodesUpdate,
        [WebSocketEvents.nodeValidationsUpdate]: nodeValidationsUpdate,
        [WebSocketEvents.recordDelete]: () => {
          alert('This record has just been deleted by another user')
          dispatchRecordDelete(history)
        },
        [WebSocketEvents.error]: throwSystemError,
      })

      AppWebSocket.on(WebSocketEvents.connectError, error => this.throwSystemError(error.stack))
      AppWebSocket.on(WebSocketEvents.error, this.throwSystemError.bind(this))

    } else if (prevUser && !user) {
      AppWebSocket.closeSocket()
      // logout - redirect to login page
      history.push(loginUri)
    }
  }

  componentWillUnmount () {
    AppWebSocket.closeSocket()
  }

  render () {
    const { isReady, systemError } = this.props

    const isLogin = getLocationPathname(this.props) === loginUri

    return (
      isReady
        ? (
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

export default withRouter(
  connect(mapStateToProps, {
    initApp,
    recordNodesUpdate,
    dispatchRecordDelete,
    nodeValidationsUpdate,
    throwSystemError,
  })
  (AppRouterSwitch)
)
