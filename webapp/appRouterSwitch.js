import './app/style.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Switch, Route, Redirect } from 'react-router'
import { TransitionGroup, Transition } from 'react-transition-group'
import DynamicImport from './commonComponents/DynamicImport'

import loginAnimation from './login/components/loginAnimation'
import appAnimation from './app/components/appAnimation'

import LoginView from './login/components/loginView'

import { initApp } from './app/actions'
import { startAppJobMonitoring } from './app/components/job/actions'
import { getUser, isReady } from './app/appState'
import { getLocationPathname } from './appUtils/routerUtils'

const loginUri = '/'

class AppRouterSwitch extends React.Component {

  componentDidMount () {
    this.props.initApp()
  }

  componentDidUpdate (prevProps) {
    const {user, startAppJobMonitoring} = this.props
    const {user: prevUser} = prevProps
    if (user && !prevUser)
      startAppJobMonitoring()
  }

  render () {
    const {location, isReady, user} = this.props

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
                  <Route path="/app" render={(props) =>
                    <DynamicImport load={() => import('./app/app')}>
                      {(Component) => Component === null ? null : <Component {...props} />}
                    </DynamicImport>
                  }/>

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
  isReady: isReady(state),
  user: getUser(state)
})

export default withRouter(
  connect(mapStateToProps, {initApp, startAppJobMonitoring})(AppRouterSwitch)
)
