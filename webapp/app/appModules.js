// ==== Guest modules

export const guest = 'guest'

export const guestModules = {
  login: {
    path: 'login/',
  },
  resetPassword: {
    key: 'resetPassword',
    path: 'resetPassword/:uuid/',
  },
  forgotPassword: {
    key: 'forgotPassword',
    path: 'forgotPassword',
  },
  accessRequest: {
    key: 'accessRequest',
    path: 'accessRequest',
  },
}

// ==== Logged in modules

// ==== App Root modules
export const appModules = {
  home: {
    key: 'home',
    path: 'home',
    icon: 'home2',
  },
  designer: {
    key: 'designer',
    path: 'designer',
    icon: 'quill',
  },
  data: {
    key: 'data',
    path: 'data',
    icon: 'table2',
  },
  users: {
    key: 'users',
    path: 'users',
    icon: 'users',
  },
  analysis: {
    key: 'analysis',
    path: 'analysis',
    icon: 'stats-dots',
  },
  help: {
    key: 'help',
    path: 'help',
    icon: 'question',
  },
}

// ==== Inner modules

export const homeModules = {
  dashboard: {
    key: 'dashboard',
    path: 'dashboard',
  },
  surveyInfo: {
    key: 'surveyInfo',
    path: 'surveyInfo',
  },
  surveyList: {
    key: 'surveys',
    path: 'surveys',
  },
  surveyTemplateList: {
    key: 'surveyTemplateList',
    path: 'surveyTemplates',
  },
  surveyNew: {
    key: 'surveyNew',
    path: 'surveyNew',
  },
  templateList: {
    key: 'templates',
    path: 'templates',
  },
  templateNew: {
    key: 'templateNew',
    path: 'templateNew',
  },
  collectImportReport: {
    key: 'collectImportReport',
    path: 'collectImportReport',
  },
}

export const designerModules = {
  formDesigner: {
    key: 'formDesigner',
    path: 'formDesigner',
  },
  nodeDef: {
    key: 'nodeDef',
    path: 'nodeDef',
  },

  surveyHierarchy: {
    key: 'surveyHierarchy',
    path: 'surveyHierarchy',
  },
  categories: {
    key: 'categories',
    path: 'categories',
  },
  category: {
    key: 'category',
    path: 'category',
  },
  taxonomies: {
    key: 'taxonomies',
    path: 'taxonomies',
  },
  taxonomy: {
    key: 'taxonomy',
    path: 'taxonomy',
  },
}

export const dataModules = {
  record: {
    key: 'record',
    path: 'record',
  },
  recordValidationReport: {
    key: 'recordValidationReport',
    path: 'recordValidationReport',
  },
  records: {
    key: 'records',
    path: 'records',
  },
  explorer: {
    key: 'explorer',
    path: 'explorer',
  },
  map: {
    key: 'map',
    path: 'map',
  },
  charts: {
    key: 'charts',
    path: 'charts',
  },
  export: {
    key: 'export',
    path: 'export',
  },
  import: {
    key: 'import',
    path: 'import',
  },
  validationReport: {
    key: 'validationReport',
    path: 'validationReport',
  },
}

export const userModules = {
  users: {
    key: 'usersList',
    path: 'users',
  },
  usersSurvey: {
    key: 'usersSurvey',
    path: 'usersSurvey',
  },
  user: {
    key: 'user',
    path: 'user',
  },
  userInvite: {
    key: 'userInvite',
    path: 'userInvite',
  },
  usersAccessRequest: {
    key: 'usersAccessRequest',
    path: 'usersAccessRequest',
  },
}

export const analysisModules = {
  chains: {
    key: 'chain_plural',
    path: 'chains',
  },
  chain: {
    key: 'chain',
    path: 'chain',
  },
  entities: {
    key: 'entities',
    path: 'entities',
  },
  nodeDef: {
    key: 'nodeDef',
    path: 'nodeDef',
  },
  category: {
    key: 'category',
    path: 'category',
  },
  instances: {
    key: 'instances',
    path: 'instances',
  },
}

export const helpModules = {
  about: {
    key: 'about',
    path: 'about',
  },
  disclaimer: {
    key: 'disclaimer',
    uri: 'https://openforis.org/legal-disclaimer/',
    external: true,
  },
  userManual: {
    key: 'userManual',
    uri: 'https://docs.google.com/document/d/1GWerrExvbdT5oOOlwdkE9pptK4pVbQxwtgaSNPasmKA/view',
    external: true,
  },
}

const allAppModuleGroups = [homeModules, designerModules, dataModules, userModules, analysisModules, helpModules]

export const app = 'app'

const _getModuleParentPathParts = (module) => {
  if (Object.values(appModules).includes(module)) return [app]
  if (Object.values(guestModules).includes(module)) return [guest]

  if (Object.values(homeModules).includes(module)) return _getModulePathParts(appModules.home)
  if (Object.values(designerModules).includes(module)) return _getModulePathParts(appModules.designer)
  if (Object.values(dataModules).includes(module)) return _getModulePathParts(appModules.data)
  if (Object.values(userModules).includes(module)) return _getModulePathParts(appModules.users)
  if (Object.values(analysisModules).includes(module)) return _getModulePathParts(appModules.analysis)
  if (Object.values(helpModules).includes(module)) return _getModulePathParts(appModules.help)

  throw new Error(`Parent path not found for module ${module?.path}`)
}

const _getModulePathParts = (module) => [..._getModuleParentPathParts(module), module.path]

const _getModuleInModuleGroupByPathPart = ({ moduleGroup, pathPart }) =>
  Object.values(moduleGroup).find((module) => module.path === pathPart)

export const getModuleByPathPart = ({ levelIndex, pathPart }) => {
  let foundModule = null

  const moduleGroups = levelIndex === 0 ? [appModules] : allAppModuleGroups

  moduleGroups.some((moduleGroup) => {
    const module = _getModuleInModuleGroupByPathPart({ moduleGroup, pathPart })
    foundModule = module
    if (foundModule) return true
  })
  return foundModule
}

export const appModuleUri = (module = appModules.home) => `/${_getModulePathParts(module).join('/')}/`
