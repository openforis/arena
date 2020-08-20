import { useRef } from 'react'
import * as R from 'ramda'

import * as Authorizer from '@core/auth/authorizer'

import {
  analysisModules,
  appModules,
  appModuleUri,
  dataModules,
  designerModules,
  homeModules,
  userModules,
} from '@webapp/app/appModules'

const keys = {
  key: 'key',
  uri: 'uri',
  icon: 'icon',
  root: 'root',
  elementRef: 'elementRef',
  children: 'children',
}

// ==== Modules hierarchy
const getModule = (module, children = null, root = true) => ({
  [keys.key]: module.key,
  [keys.uri]: appModuleUri(module),
  [keys.icon]: module.icon,
  [keys.root]: root,
  [keys.elementRef]: useRef(null),
  [keys.children]: children ? children.map((childModule) => getModule(childModule, null, false)) : [],
})

export const getModulesHierarchy = (user, surveyInfo) => [
  getModule(appModules.home),
  getModule(appModules.designer, [
    designerModules.formDesigner,
    designerModules.surveyHierarchy,
    designerModules.categories,
    designerModules.taxonomies,
  ]),
  getModule(appModules.data, [
    dataModules.records,
    dataModules.explorer,
    ...(Authorizer.canCleanseRecords(user, surveyInfo) ? [dataModules.validationReport] : []),
  ]),
  ...(Authorizer.canAnalyzeRecords(user, surveyInfo)
    ? [getModule(appModules.analysis, [analysisModules.processingChains])]
    : []),
  getModule(appModules.users, [userModules.users]),
]

export const getKey = R.prop(keys.key)
export const getUri = R.prop(keys.uri)
export const getIcon = R.prop(keys.icon)
export const getChildren = R.prop(keys.children)

export const isRoot = R.propEq(keys.root, true)
export const isHome = (module) => getKey(module) === appModules.home.key
export const isActive = (pathname) => (module) => {
  // Module home is active when page is on dashboard
  return isHome(module) ? pathname === appModuleUri(homeModules.dashboard) : R.startsWith(module.uri, pathname)
}

export const getElementRef = R.prop(keys.elementRef)
export const getDomElement = R.pipe(getElementRef, R.prop('current'))
