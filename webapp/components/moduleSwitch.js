import './moduleSwitch.scss'

import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router'
import PropTypes from 'prop-types'

import { app, appModuleUri } from '@webapp/app/appModules'
import { useIsInRoute } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

const NotFoundPage = () => {
  const i18n = useI18n()

  return <div className="page-not-found-message">{i18n.t('error.pageNotFound')}</div>
}

const FallbackComponent = <>...</>

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
            <React.Suspense fallback={FallbackComponent}>
              {React.createElement(module.component, module.props)}
            </React.Suspense>
          }
        />
      ))}
      <Route path="*" element={<NotFoundPage />} />
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
