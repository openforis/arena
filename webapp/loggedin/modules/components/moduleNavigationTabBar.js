import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import { Redirect } from 'react-router-dom'

import { appModuleUri } from '../../appModules'

const NavigationTabBar = props => {

  const {
    modules, moduleRoot, moduleDefault,
    location,
  } = props

  const isRootUri = location.pathname === appModuleUri(moduleRoot)

  return isRootUri
    ? (
      <Redirect to={appModuleUri(moduleDefault)}/>
    ) : (
      <Switch location={location}>
        {
          modules.map((module, i) =>
            <Route
              key={i}
              exact path={module.path}
              render={props =>
                React.createElement(module.component, { ...module.props, ...props })
              }/>
          )
        }
      </Switch>
    )
}

NavigationTabBar.defaultProps = {
  tabs: [],
  className: '',
  moduleRoot: '',
  moduleDefault: '',
}

export default withRouter(NavigationTabBar)