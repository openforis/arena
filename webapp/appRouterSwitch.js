import './app/style.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Switch, Route, Redirect } from 'react-router'
import { TransitionGroup, Transition } from 'react-transition-group'

import loginAnimation from './login/components/loginAnimation'
import appAnimation from './app/components/appAnimation'

import LoginView from './login/components/loginView'
import AppView from './app/components/appView'

import { appState, isLocationLogin, loginUri } from './app/app'
import { initApp } from './app/actions'
import { activeJobUpdate } from './app/components/job/actions'

import { openSocket, closeSocket, onSocketEvent } from './app/appWebSocket'
import { jobSocketEvents } from '../common/job/job'

class AppRouterSwitch extends React.Component {

  componentDidMount () {
    this.props.initApp()

  }

  componentDidUpdate (prevProps) {
    const {user} = this.props
    const {user: prevUser} = prevProps

    if (user && !prevUser) {
      openSocket()
      onSocketEvent(jobSocketEvents.update, this.props.activeJobUpdate)
    } else if (prevUser && !user) {
      closeSocket()
    }
  }

  componentWillUnmount () {
    closeSocket()
  }

  render () {
    const {location, isReady, user} = this.props

    const isLogin = isLocationLogin(this.props)

    const {
      key,
      onEnter,
      onExit
    } = isLogin ? loginAnimation : appAnimation

    return (
      isReady
        ? (
          <React.Fragment>

            {
              !user && !isLogin
                ? <Redirect to={loginUri}/>
                : null
            }

            <div className="main__bg1"/>
            <div className="main__bg2"/>
            <div className="main__bg-overlay"/>

            <TransitionGroup component={null}>
              <Transition
                key={key}
                appear={true}
                timeout={2000}
                onEnter={onEnter}
                onExit={onExit}>

                <Switch location={location}>

                  <Route exact path="/" component={LoginView}/>
                  <Route path="/app" component={AppView}/>

                </Switch>

              </Transition>
            </TransitionGroup>
          </React.Fragment>
        )
        : (
          null
        )
    )
  }
}

const mapStateToProps = state => ({
  isReady: appState.isReady(state),
  user: appState.getUser(state)
})

export default withRouter(
  connect(mapStateToProps, {
    initApp,
    activeJobUpdate
  })
  (AppRouterSwitch)
)
