import './app/style.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import { TransitionGroup, Transition } from 'react-transition-group'

import { initApp } from './app/actions'
import { isAppReady } from './app/app'

import loginAnimation from './login/loginAnimation'
import appAnimation from './app/appAnimation'

import LoginView from './login/loginView'
import AppView from './app/appView'

class AppRouterSwitch extends React.Component {

  componentDidMount () {
    this.props.initApp()
  }

  render () {
    const {location, isReady} = this.props
    const {pathname} = location

    const isLogin = pathname === '/'

    const {
      key,
      onEnter,
      onExit
    } = isLogin ? loginAnimation : appAnimation

    return (
      isReady
        ? <TransitionGroup component={null}>
          <Transition
            key={key}
            appear={true}
            timeout={2000}
            onEnter={onEnter}
            onExit={onExit}>

            <Switch location={location}>

              <Route exact path="/" component={LoginView}/>
              <Route exact path="/app" component={AppView}/>
              <Route exact path="/app/a" component={AppView}/>

            </Switch>

          </Transition>
        </TransitionGroup>
        : null
    )
  }
}

const mapStateToProps = state => ({
  ...state.app,
  isReady: isAppReady(state)
})

export default withRouter(
  connect(mapStateToProps, {initApp})(AppRouterSwitch)
)
