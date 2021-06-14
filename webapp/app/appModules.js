// ==== Guest modules

export const guest = 'guest'

export const guestModules = {
  resetPassword: {
    path: `/${guest}/resetPassword/:uuid/`,
  },
  forgotPassword: {
    path: `/${guest}/forgotPassword/`,
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
}

// ==== Inner modules

export const homeModules = {
  dashboard: {
    key: 'dashboard',
    path: `${appModules.home.path}/dashboard`,
  },
  surveyInfo: {
    key: 'surveyInfo',
    path: `${appModules.home.path}/surveyInfo`,
  },
  surveyList: {
    key: 'surveys',
    path: `${appModules.home.path}/surveys`,
  },
  surveyTemplateList: {
    key: 'surveyTemplateList',
    path: `${appModules.home.path}/surveyTemplates`,
  },
  surveyNew: {
    key: 'surveyNew',
    path: `${appModules.home.path}/surveyNew`,
  },
  templateList: {
    key: 'templates',
    path: `${appModules.home.path}/templates`,
  },
  templateNew: {
    key: 'templateNew',
    path: `${appModules.home.path}/templateNew`,
  },
  collectImportReport: {
    key: 'collectImportReport',
    path: `${appModules.home.path}/collectImportReport`,
  },
}

export const designerModules = {
  formDesigner: {
    key: 'formDesigner',
    path: `${appModules.designer.path}/formDesigner`,
  },
  nodeDef: {
    key: 'nodeDef',
    path: `${appModules.designer.path}/nodeDef`,
  },

  surveyHierarchy: {
    key: 'surveyHierarchy',
    path: `${appModules.designer.path}/surveyHierarchy`,
  },
  categories: {
    key: 'categories',
    path: `${appModules.designer.path}/categories`,
  },
  category: {
    key: 'category',
    path: `${appModules.designer.path}/category`,
  },
  taxonomies: {
    key: 'taxonomies',
    path: `${appModules.designer.path}/taxonomies`,
  },
  taxonomy: {
    key: 'taxonomy',
    path: `${appModules.designer.path}/taxonomy`,
  },
}

export const dataModules = {
  record: {
    key: 'record',
    path: `${appModules.data.path}/record`,
  },
  records: {
    key: 'records',
    path: `${appModules.data.path}/records`,
  },
  explorer: {
    key: 'explorer',
    path: `${appModules.data.path}/explorer`,
  },
  export: {
    key: 'export',
    path: `${appModules.data.path}/export`,
  },
  import: {
    key: 'import',
    path: `${appModules.data.path}/import`,
  },
  validationReport: {
    key: 'validationReport',
    path: `${appModules.data.path}/validationReport`,
  },
}

export const userModules = {
  users: {
    key: 'userList',
    path: `${appModules.users.path}/userList`,
  },
  user: {
    key: 'user',
    path: `${appModules.users.path}/user`,
  },
  userInvite: {
    key: 'userInvite',
    path: `${appModules.users.path}/userInvite`,
  },
}

export const analysisModules = {
  processingChains: {
    key: 'processingChain_plural',
    path: `${appModules.analysis.path}/chains`,
  },
  processingChain: {
    key: 'processingChain',
    path: `${appModules.analysis.path}/chain`,
  },
  entities: {
    key: 'entities',
    path: `${appModules.analysis.path}/entities`,
  },
  nodeDef: {
    key: 'nodeDef',
    path: `${appModules.analysis.path}/nodeDef`,
  },
  category: {
    key: 'category',
    path: `${appModules.analysis.path}/category`,
  },
}

export const app = 'app'
export const appModuleUri = (module = appModules.home) => `/${[app, module.path].join('/')}/`
