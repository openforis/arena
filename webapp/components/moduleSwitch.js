import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router'
import PropTypes from 'prop-types'

import { app, appModuleUri } from '@webapp/app/appModules'
import { useIsInRoute } from '@webapp/components/hooks'

const ModuleSwitch = (props) => {
  const { modules, moduleRoot, moduleDefault } = props

  const navigate = useNavigate()

  if (moduleDefault) {
    // redirect to default module/url
    const rootPath = moduleRoot ? appModuleUri(moduleRoot) : `/${app}`

    const isInRootModule = useIsInRoute(rootPath)

    useEffect(() => {
      if (isInRootModule) {
        navigate(appModuleUri(moduleDefault), { replace: true })
      }
    }, [isInRootModule])
  }

  return (
    <Routes>
      {modules.map((module, i) => (
        <Route
          key={i}
          path={module.path}
          element={
            <React.Suspense fallback={<>...</>}>{React.createElement(module.component, module.props)}</React.Suspense>
          }
        />
      ))}
    </Routes>
  )
}

ModuleSwitch.propTypes = {
  modules: PropTypes.array.isRequired,
  moduleRoot: PropTypes.object,
  moduleDefault: PropTypes.object,
}

ModuleSwitch.defaultProps = {
  modules: [],
  moduleRoot: null,
  moduleDefault: null,
}

export default ModuleSwitch
