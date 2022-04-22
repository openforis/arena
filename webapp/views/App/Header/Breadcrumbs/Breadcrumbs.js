import './Breadcrumbs.scss'

import React from 'react'
import { useLocation } from 'react-router'

import * as AppModules from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { Link } from 'react-router-dom'

export const Breadcrumbs = () => {
  const location = useLocation()
  const i18n = useI18n()

  const { pathname } = location
  const pathParts = pathname.split('/')

  const validPathParts = pathParts.filter((pathPart) => pathPart && pathPart !== AppModules.app)
  const pathPartsWithModules = validPathParts.filter((pathPart, levelIndex) =>
    Boolean(AppModules.getModuleByPathPart({ levelIndex, pathPart }))
  )

  const pathComponents = pathPartsWithModules.reduce((acc, pathPart, levelIndex) => {
    const module = AppModules.getModuleByPathPart({ levelIndex, pathPart })
    const pathName = i18n.t(`appModules.${module.key}`)
    const isLast = levelIndex === pathPartsWithModules.length - 1

    acc.push(
      <div className="breadcrumbs-item" key={module.key}>
        {isLast && <span key={module.key}>{pathName}</span>}
        {!isLast && (
          <>
            <Link type="button" className="btn-transparent" to={AppModules.appModuleUri(module)}>
              {pathName}
            </Link>
            <span className="separator">&nbsp;&nbsp;&#47;&nbsp;&nbsp;</span>
          </>
        )}
      </div>
    )
    return acc
  }, [])

  return <div className="breadcrumbs">{pathComponents}</div>
}
