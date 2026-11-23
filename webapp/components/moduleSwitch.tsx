import './moduleSwitch.scss'

import React, { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router'

import { app, appModuleUri } from '@webapp/app/appModules'
import { useIsInRoute } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

const NotFoundPage = () => {
  const i18n = useI18n()

  return <div className="page-not-found-message">{i18n.t('error.pageNotFound')}</div>
}

const FallbackComponent = () => <>...</>

type AppModule = { key: string; path: string; icon?: string }

type ModuleSwitchProps = {
  modules: { path: string; component: React.ElementType; props?: Record<string, unknown> }[]
  moduleRoot?: AppModule
  moduleDefault?: AppModule
}

const ModuleSwitch = (props: ModuleSwitchProps) => {
  const { modules = [], moduleRoot = null, moduleDefault = null } = props

  const navigate = useNavigate()

  const rootPath = moduleRoot ? appModuleUri(moduleRoot) : `/${app}`
  const isInRootModule = useIsInRoute(rootPath)

  // redirect to default module/url
  useEffect(() => {
    if (moduleDefault && isInRootModule) {
      navigate(appModuleUri(moduleDefault), { replace: true })
    }
  }, [isInRootModule, moduleDefault, navigate])

  return (
    <Routes>
      {modules.map((module) => (
        <Route
          key={module.path}
          path={module.path}
          element={
            <React.Suspense fallback={<FallbackComponent />}>
              {React.createElement(module.component, module.props)}
            </React.Suspense>
          }
        />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default ModuleSwitch
