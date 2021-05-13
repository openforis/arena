import { useRef } from 'react'
import * as R from 'ramda'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'

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
  hidden: 'hidden',
}

// ==== Modules hierarchy
const getModule = ({ module, children = null, root = true, hidden = false }) => ({
  [keys.key]: module.key,
  [keys.uri]: appModuleUri(module),
  [keys.icon]: module.icon,
  [keys.root]: root,
  [keys.elementRef]: useRef(null),
  [keys.children]: children ? children.map((childModule) => getModule({ module: childModule, root: false })) : [],
  [keys.hidden]: hidden,
})

export const getModulesHierarchy = (user, surveyInfo) => [
  // home
  getModule({ module: appModules.home }),
  // designer
  getModule({
    module: appModules.designer,
    children: [
      designerModules.formDesigner,
      designerModules.surveyHierarchy,
      designerModules.categories,
      designerModules.taxonomies,
    ],
  }),
  // data
  getModule({
    module: appModules.data,
    children: [
      dataModules.records,
      dataModules.explorer,
      dataModules.export,
      ...(Authorizer.canCleanseRecords(user, surveyInfo) ? [dataModules.validationReport] : []),
    ],
    hidden: Survey.isTemplate(surveyInfo),
  }),
  // analysis
  getModule({
    module: appModules.analysis,
    children: [analysisModules.processingChains, analysisModules.entities],
    hidden: !Authorizer.canAnalyzeRecords(user, surveyInfo),
  }),
  // users
  getModule({ module: appModules.users, children: [userModules.users], hidden: Survey.isTemplate(surveyInfo) }),
]

export const getKey = R.prop(keys.key)
export const getUri = R.prop(keys.uri)
export const getIcon = R.prop(keys.icon)
export const getChildren = R.prop(keys.children)

export const isRoot = R.propEq(keys.root, true)
export const isHidden = R.propEq(keys.hidden, true)
export const isHome = (module) => getKey(module) === appModules.home.key
export const isActive = (pathname) => (module) => {
  // Module home is active when page is on dashboard
  return isHome(module) ? pathname === appModuleUri(homeModules.dashboard) : R.startsWith(module.uri, pathname)
}

export const getElementRef = R.prop(keys.elementRef)
export const getDomElement = R.pipe(getElementRef, R.prop('current'))
