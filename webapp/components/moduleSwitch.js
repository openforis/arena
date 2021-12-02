import React from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'

import { appModuleUri } from '@webapp/app/appModules'

const ModuleSwitch = (props) => {
  const { modules, moduleRoot, moduleDefault } = props

  const location = useLocation()
  const navigate = useNavigate()

  const isRootUri = location.pathname === appModuleUri(moduleRoot)

  if (isRootUri) {
    navigate(appModuleUri(moduleDefault), { replace: true })
  }

  return (
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

export default ModuleSwitch
