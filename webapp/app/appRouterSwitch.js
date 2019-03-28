import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Switch, Route } from 'react-router-dom'
import { TransitionGroup, Transition } from 'react-transition-group'
import DynamicImport from '../commonComponents/dynamicImport'

import LoginView from '../login/components/loginView'

import { throwSystemError, initApp } from './actions'
import * as AppState from './appState'
import { getLocationPathname } from '../appUtils/routerUtils'

import WebSocketEvents from '../../common/webSocket/webSocketEvents'
import { openSocket, closeSocket } from './appWebSocket'
import { activeJobUpdate } from '../appModules/appView/components/job/actions'
import { recordNodesUpdate, nodeValidationsUpdate, dispatchRecordDelete } from '../appModules/surveyForm/record/actions'

const loginUri = '/'

class AppRouterSwitch extends React.Component {

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
      openSocket({
        [WebSocketEvents.jobUpdate]: activeJobUpdate,
        [WebSocketEvents.nodesUpdate]: recordNodesUpdate,
        [WebSocketEvents.nodeValidationsUpdate]: nodeValidationsUpdate,
        [WebSocketEvents.recordDelete]: () => {
          alert('This record has just been deleted by another user')
          dispatchRecordDelete(history)
        },
        [WebSocketEvents.error]: throwSystemError,
      })
    } else if (prevUser && !user) {
      closeSocket()
      // logout - redirect to login page
      history.push(loginUri)
    }
  }

  componentWillUnmount () {
    closeSocket()
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
                        <DynamicImport {...props} load={() => import('../appModules/appView/appViewExport')}/>
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
    activeJobUpdate,
    recordNodesUpdate,
    dispatchRecordDelete,
    nodeValidationsUpdate,
    throwSystemError,
  })
  (AppRouterSwitch)
)
