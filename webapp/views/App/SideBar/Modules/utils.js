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
  helpModules,
} from '@webapp/app/appModules'

const keys = {
  key: 'key',
  uri: 'uri',
  icon: 'icon',
  root: 'root',
  elementRef: 'elementRef',
  children: 'children',
  hidden: 'hidden',
  external: 'external',
}

// ==== Modules hierarchy
const getModule = ({ module, children = null, root = true, hidden = false }) => ({
  [keys.key]: module.key,
  [keys.uri]: module.uri ? module.uri : appModuleUri(module),
  [keys.icon]: module.icon,
  [keys.root]: root,
  [keys.elementRef]: useRef(null),
  [keys.children]: children ? children.map((childModule) => getModule({ module: childModule, root: false })) : [],
  [keys.hidden]: hidden,
  [keys.external]: module.external,
})

export const getModulesHierarchy = (user, surveyInfo) => {
  const canEditSurvey = Authorizer.canEditSurvey(user, surveyInfo)
  const canAnalyzeRecords = Authorizer.canAnalyzeRecords(user, surveyInfo)
  const canExportRecords = Authorizer.canExportRecords(user, surveyInfo)
  const canImportRecords = Authorizer.canImportRecords(user, surveyInfo)

  return [
    // home
    getModule({ module: appModules.home }),
    // designer
    getModule({
      module: appModules.designer,
      children: [
        ...(canEditSurvey ? [designerModules.formDesigner] : []),
        designerModules.surveyHierarchy,
        ...(canAnalyzeRecords ? [designerModules.categories] : []),
        ...(canAnalyzeRecords ? [designerModules.taxonomies] : []),
      ],
    }),
    // data
    getModule({
      module: appModules.data,
      children: [
        dataModules.records,
        dataModules.explorer,
        ...(Authorizer.canUseMap(user, surveyInfo) ? [dataModules.map] : []),
        ...(Authorizer.canUseCharts(user, surveyInfo) ? [dataModules.charts] : []),
        ...(canExportRecords ? [dataModules.export] : []),
        ...(canImportRecords ? [dataModules.import] : []),
        ...(Authorizer.canCleanseRecords(user, surveyInfo) ? [dataModules.validationReport] : []),
      ],
      hidden: Survey.isTemplate(surveyInfo),
    }),
    // analysis
    getModule({
      module: appModules.analysis,
      children: [
        analysisModules.chains,
        analysisModules.instances,
        // , analysisModules.entities
      ],
      hidden: !canAnalyzeRecords,
    }),
    // users
    getModule({
      module: appModules.users,
      children: [userModules.usersSurvey],
      hidden: !Authorizer.canViewSurveyUsers(user, surveyInfo) || Survey.isTemplate(surveyInfo),
    }),
    getModule({
      module: appModules.help,
      children: [helpModules.userManual, helpModules.about, helpModules.disclaimer],
    }),
  ]
}

export const getKey = R.prop(keys.key)
export const getUri = R.prop(keys.uri)
export const getIcon = R.prop(keys.icon)
export const getChildren = R.prop(keys.children)

export const isRoot = R.propEq(keys.root, true)
export const isHidden = R.propEq(keys.hidden, true)
export const isExternal = R.propEq(keys.external, true)
export const isHome = (module) => getKey(module) === appModules.home.key
export const isSurveySelectionRequired = (module) =>
  ![appModules.home.key, appModules.help.key].includes(getKey(module))
export const isActive = (pathname) => (module) => {
  // Module home is active when page is on dashboard
  return isHome(module) ? pathname === appModuleUri(homeModules.dashboard) : R.startsWith(module.uri, pathname)
}

export const getElementRef = R.prop(keys.elementRef)
export const getDomElement = R.pipe(getElementRef, R.prop('current'))
