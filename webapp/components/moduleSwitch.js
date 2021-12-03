import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router'

import { appModuleUri } from '@webapp/app/appModules'
import { useIsInRoute } from '@webapp/components/hooks'

const ModuleSwitch = (props) => {
  const { modules, moduleRoot, moduleDefault } = props

  const navigate = useNavigate()
  const isInRootModule = useIsInRoute(appModuleUri(moduleRoot))

  useEffect(() => {
    if (isInRootModule) {
      // redirect to default url
      navigate(appModuleUri(moduleDefault), { replace: true })
    }
  }, [isInRootModule])

  return (
    <Routes>
      {modules.map((module, i) => (
        <Route key={i} path={module.path} element={React.createElement(module.component, module.props)} />
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
