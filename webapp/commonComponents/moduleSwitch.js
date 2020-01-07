import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import { Redirect } from 'react-router-dom'

import { appModuleUri } from '@webapp/app/appModules'

const ModuleSwitch = props => {
  const { modules, moduleRoot, moduleDefault, location } = props

  const isRootUri = location.pathname === appModuleUri(moduleRoot)

  return isRootUri ? (
    <Redirect to={appModuleUri(moduleDefault)} />
  ) : (
    <Switch location={location}>
      {modules.map((module, i) => (
        <Route
          key={i}
          exact
          path={module.path}
          render={props => React.createElement(module.component, { ...module.props, ...props })}
        />
      ))}
    </Switch>
  )
}

ModuleSwitch.defaultProps = {
  modules: [],
  moduleRoot: '',
  moduleDefault: '',
}

export default withRouter(ModuleSwitch)
