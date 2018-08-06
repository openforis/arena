import './app/style.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Switch, Route, Redirect } from 'react-router'
import { TransitionGroup, Transition } from 'react-transition-group'

import { initApp } from './app/actions'
import { appState, isLocationLogin, loginUri } from './app/app'

import loginAnimation from './login/components/loginAnimation'
import appAnimation from './app/components/appAnimation'

import LoginView from './login/components/loginView'
import AppView from './app/components/appView'

class AppRouterSwitch extends React.Component {

  componentDidMount () {
    this.props.initApp()
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
  connect(mapStateToProps, {initApp})(AppRouterSwitch)
)
