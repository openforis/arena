import * as AppModules from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import React from 'react'
import { useLocation } from 'react-router'

export const Breadcrumbs = () => {
  const location = useLocation()
  const i18n = useI18n()

  const { pathname } = location
  const pathParts = pathname.split('/')
  const pathNames = pathParts
    .filter((part) => part && part !== AppModules.app)
    .map((part) => i18n.t(`appModules.${part}`))

  const pathComponents = pathNames.reduce((acc, pathName, index) => {
    acc.push(<span>{pathName}</span>)
    if (index < pathNames.length - 1) acc.push(<span> / </span>)
    return acc
  }, [])

  return <div>{pathComponents}</div>
}
