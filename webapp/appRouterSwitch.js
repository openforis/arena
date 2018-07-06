import './app/app.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import { TransitionGroup, Transition } from 'react-transition-group'

import loginAnimation from './login/loginAnimation'
import appAnimation from './app/appAnimation'

import LoginView from './login/loginView'
import AppView from './app/appView'

class AppRouterSwitch extends React.Component {

  render () {
    const {location} = this.props
    const {pathname} = location

    const isLogin = pathname === '/'

    const {
      key,
      onEnter,
      onExit
    } = isLogin ? loginAnimation : appAnimation

    return (
      <TransitionGroup component={null}>
        <Transition
          key={key}
          appear={true}
          timeout={2000}
          onEnter={onEnter}
          onExit={onExit}>

          <Switch location={location}>
            <Route exact path="/" component={LoginView}/>
            <Route exact path="/app/a" component={AppView}/>
          </Switch>

        </Transition>
      </TransitionGroup>
    )
  }
}

const mapStateToProps = state => ({
  x: 'a'
  // i18n: R.path(['app', 'i18n'], state),
  // appReady: !!R.path(['app', 'i18n'], state)
})

export default withRouter(
  connect(mapStateToProps)(AppRouterSwitch)
)
