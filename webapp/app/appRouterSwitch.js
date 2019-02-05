import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import { TransitionGroup, Transition } from 'react-transition-group'
import DynamicImport from '../commonComponents/DynamicImport'

import loginAnimation from '../login/components/loginAnimation'
import appAnimation from './appAnimation'

import LoginView from '../login/components/loginView'

import { throwSystemError, initApp } from './actions'
import * as AppState from './appState'
import { getLocationPathname } from '../appUtils/routerUtils'

import WebSocketEvents from '../../common/webSocket/webSocketEvents'
import { openSocket, closeSocket } from './appWebSocket'
import { activeJobUpdate } from '../appModules/appView/components/job/actions'
import { appModules, appModuleUri } from '../appModules/appModules'
import { recordNodesUpdate, nodeValidationsUpdate } from '../appModules/surveyForm/record/actions'

const loginUri = '/'

class AppRouterSwitch extends React.Component {

  componentDidMount () {
    this.props.initApp()
  }

  componentDidUpdate (prevProps) {
    const {
      user, history,
      activeJobUpdate, recordNodesUpdate, nodeValidationsUpdate, throwSystemError
    } = this.props
    const { user: prevUser } = prevProps

    if (user && !prevUser) {
      openSocket({
        [WebSocketEvents.jobUpdate]: activeJobUpdate,
        [WebSocketEvents.nodesUpdate]: recordNodesUpdate,
        [WebSocketEvents.nodeValidationsUpdate]: nodeValidationsUpdate,
        [WebSocketEvents.recordDelete]: () => {
          alert('This record has just been deleted by another user')
          history.push(appModuleUri(appModules.data))
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
    const { location, isReady, systemError } = this.props

    const isLogin = getLocationPathname(this.props) === loginUri

    const {
      key,
      onEnter,
      onExit
    } = isLogin ? loginAnimation : appAnimation

    return (
      isReady
        ? (
          <React.Fragment>

            <div className="main__bg1"/>
            <div className="main__bg2"/>
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
                  <TransitionGroup component={null}>
                    <Transition
                      key={key}
                      appear={true}
                      timeout={2000}
                      onEnter={onEnter}
                      onExit={onExit}>

                      <Switch location={location}>

                        <Route exact path="/" component={LoginView}/>
                        <Route path="/app" render={(props) =>
                          <DynamicImport load={() => import('../appModules/appView/appViewExport')}>
                            {(Component) => Component === null ? null : <Component {...props} />}
                          </DynamicImport>
                        }/>

                      </Switch>

                    </Transition>
                  </TransitionGroup>
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
    nodeValidationsUpdate,
    throwSystemError,
  })
  (AppRouterSwitch)
)
