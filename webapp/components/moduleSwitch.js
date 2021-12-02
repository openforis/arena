import React from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'

import { appModuleUri } from '@webapp/app/appModules'

const ModuleSwitch = (props) => {
  const { modules, moduleRoot, moduleDefault } = props

  const location = useLocation()
  const navigate = useNavigate()

  const isRootUri = location.pathname === appModuleUri(moduleRoot)

  if (isRootUri) {
    // redirect to default url
    navigate(appModuleUri(moduleDefault), { replace: true })
  }

  return (
    <Routes>
      {modules.map((module, i) => {
        const component = React.createElement(module.component, module.props)
        return <Route key={i} path={module.path} element={component} />
      })}
    </Routes>
  )
}

ModuleSwitch.defaultProps = {
  modules: [],
  moduleRoot: '',
  moduleDefault: '',
}

export default ModuleSwitch
