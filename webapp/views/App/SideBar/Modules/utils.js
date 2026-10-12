import * as A from '@core/arena'

import * as User from '@core/user/user'
import { Authorizer } from '@openforis/arena-core'
import * as Survey from '@core/survey/survey'
import * as ProcessUtils from '@core/processUtils'

import {
  analysisModules,
  appModules,
  appModuleUri,
  dataModules,
  designerModules,
  homeModules,
  userModules,
  helpModules,
  messageModules,
  systemAdminModules,
} from '@webapp/app/appModules'

const keys = {
  key: 'key',
  uri: 'uri',
  icon: 'icon',
  root: 'root',
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
  [keys.children]: children ? children.map((childModule) => getModule({ module: childModule, root: false })) : [],
  [keys.hidden]: hidden,
  [keys.external]: module.external,
})

const getDesignerModule = (user, surveyInfo) => {
  const canEditSurvey = Authorizer.canEditSurvey(user, surveyInfo)
  return getModule({
    module: appModules.designer,
    children: [
      ...(canEditSurvey ? [designerModules.formDesigner] : []),
      designerModules.surveyHierarchy,
      ...(canEditSurvey ? [designerModules.surveyDependencyTree] : []),
      designerModules.categories,
      designerModules.taxonomies,
    ],
  })
}

const getDataModule = (user, surveyInfo) =>
  getModule({
    module: appModules.data,
    children: [
      dataModules.records,
      ...(Authorizer.canUseExplorer(user, surveyInfo) ? [dataModules.explorer] : []),
      ...(Authorizer.canUseMap(user, surveyInfo) ? [dataModules.map] : []),
      ...(Authorizer.canExportRecords(user, surveyInfo) ? [dataModules.export] : []),
      ...(Authorizer.canImportRecords(user, surveyInfo) ? [dataModules.import] : []),
      ...(Authorizer.canCleanseRecords(user, surveyInfo) ? [dataModules.validationReport] : []),
    ],
    hidden: Survey.isTemplate(surveyInfo),
  })

const getAnalysisModule = (user, surveyInfo) =>
  getModule({
    module: appModules.analysis,
    children: [
      analysisModules.chains,
      ...(Survey.isPublished(surveyInfo) ? [analysisModules.instances] : []),
      // , analysisModules.entities
    ],
    hidden: !Authorizer.canAnalyzeRecords(user, surveyInfo),
  })

const getUsersModule = (user, surveyInfo) =>
  getModule({
    module: appModules.users,
    children: [
      userModules.usersSurvey,
      ...(Authorizer.canManageUserGroups(user, surveyInfo) ? [userModules.userGroups] : []),
    ],
    hidden: !Authorizer.canViewSurveyUsers(user, surveyInfo) || Survey.isTemplate(surveyInfo),
  })

const getSystemAdminModules = (user) => {
  if (!User.isSystemAdmin(user)) return []
  const canViewUsersAccessRequests =
    ProcessUtils.ENV.allowUserAccessRequest && Authorizer.canViewUsersAccessRequests(user)
  return [
    getModule({
      module: appModules.messages,
      children: [messageModules.messages],
    }),
    getModule({
      module: appModules.systemAdmin,
      children: [
        ...(canViewUsersAccessRequests ? [userModules.usersAccessRequest] : []),
        ...(Authorizer.canViewAllUsers(user) ? [userModules.users] : []),
        systemAdminModules.jobMonitor,
        systemAdminModules.systemLogs,
      ],
    }),
  ]
}

const getHelpModule = (user) =>
  getModule({
    module: appModules.help,
    children: [
      helpModules.userManual,
      helpModules.about,
      helpModules.whatsNew,
      ...(User.isSystemAdmin(user) ? [helpModules.changelog] : []),
      helpModules.disclaimer,
    ],
  })

export const getModulesHierarchy = (user, surveyInfo) => [
  getModule({ module: appModules.home }),
  getModule({ module: appModules.dashboard }),
  getDesignerModule(user, surveyInfo),
  getDataModule(user, surveyInfo),
  getAnalysisModule(user, surveyInfo),
  getUsersModule(user, surveyInfo),
  ...getSystemAdminModules(user),
  getHelpModule(user),
]

export const getKey = A.prop(keys.key)
export const getUri = A.prop(keys.uri)
export const getIcon = A.prop(keys.icon)
export const getChildren = A.prop(keys.children)

export const isRoot = A.propEq(keys.root, true)
export const isHidden = A.propEq(keys.hidden, true)
export const isExternal = A.propEq(keys.external, true)
export const isHome = (module) => getKey(module) === appModules.home.key
export const isSurveySelectionRequired = (module) =>
  ![appModules.home.key, appModules.help.key, appModules.systemAdmin.key].includes(getKey(module))
export const isActive = (pathname) => (module) => {
  // Module home is active when page is on landing
  return isHome(module) ? pathname === appModuleUri(homeModules.landing) : A.startsWith(module.uri, pathname)
}
