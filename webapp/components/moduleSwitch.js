import React from 'react'
import { Route, Routes, withRouter } from 'react-router'
import { Redirect } from 'react-router-dom'

import { appModuleUri } from '@webapp/app/appModules'

const ModuleSwitch = (props) => {
  const { modules, moduleRoot, moduleDefault, location } = props

  const isRootUri = location.pathname === appModuleUri(moduleRoot)

  return isRootUri ? (
    <Redirect to={appModuleUri(moduleDefault)} />
  ) : (
    <Routes location={location}>
      {modules.map((module, i) => (
        <Route
          key={i}
          exact
          path={module.path}
          render={(props) => React.createElement(module.component, { ...module.props, ...props })}
        />
      ))}
    </Routes>
  )
}

ModuleSwitch.defaultProps = {
  modules: [],
  moduleRoot: '',
  moduleDefault: '',
}

export default withRouter(ModuleSwitch)
