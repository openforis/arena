const app = 'app'

export const appModuleUri = (module = appModules.home) => `/${[app, module.path].join('/')}/`

//==== App Root modules
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
    icon: 'users'
  },
  analysis: {
    key: 'analysis',
    path: 'analysis',
    icon: 'stats-dots'
  },
}

//==== Inner modules

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
  surveyNew: {
    key: 'surveyNew',
    path: `${appModules.home.path}/surveyNew`,
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
  surveyHierarchy: {
    key: 'surveyHierarchy',
    path: `${appModules.designer.path}/surveyHierarchy`,
  },
  categories: {
    key: 'categories',
    path: `${appModules.designer.path}/categories`,
  },
  taxonomies: {
    key: 'taxonomies',
    path: `${appModules.designer.path}/taxonomies`,
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
  dataVis: {
    key: 'dataVis',
    path: `${appModules.data.path}/dataVis`,
  },
  validationReport: {
    key: 'validationReport',
    path: `${appModules.data.path}/validationReport`,
  },
}

export const userModules = {
  users: {
    key: 'userList',
    path: `${appModules.users.path}/list`,
  },
  user: {
    key: 'view',
    path: `${appModules.users.path}/user`,
  }
}

export const analysisModules = {
  processingChains: {
    key: 'processingChain_plural',
    path: `${appModules.analysis.path}/processingChains`,
  },
  processingChain: {
    key: 'processingChain',
    path: `${appModules.analysis.path}/processingChain`,
  },
  processingStep: {
    key: 'processingStep',
    path: `${appModules.analysis.path}/processingStep`,
  },
}