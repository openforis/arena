import './Breadcrumbs.scss'

import React from 'react'
import { useLocation } from 'react-router'

import * as AppModules from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'

export const Breadcrumbs = () => {
  const location = useLocation()
  const i18n = useI18n()

  const { pathname } = location
  const pathParts = pathname.split('/')

  const validPathParts = pathParts.filter((pathPart) => pathPart && pathPart !== AppModules.app)

  const pathComponents = validPathParts.reduce((acc, pathPart, levelIndex) => {
    const moduleKey = AppModules.getModuleKeyByPathPart({ levelIndex, pathPart })
    if (!moduleKey) return acc

    const pathName = i18n.t(`appModules.${moduleKey}`)
    const isLast = levelIndex === validPathParts.length - 1

    acc.push(<span>{pathName}</span>)

    if (!isLast) {
      // add separator
      acc.push(<span> / </span>)
    }

    return acc
  }, [])

  return (
    <div className="breadcrumbs">
      <div className="separator" />
      <div>{pathComponents}</div>
    </div>
  )
}
