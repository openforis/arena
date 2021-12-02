// ==== Guest modules

export const guest = 'guest'

export const guestModules = {
  resetPassword: {
    path: `resetPassword/:uuid/`,
    pathFull: `/${guest}/resetPassword/:uuid/`,
  },
  forgotPassword: {
    path: `forgotPassword/`,
    pathFull: `/${guest}/forgotPassword/`,
  },
  accessRequest: {
    path: `accessRequest/`,
    pathFull: `/${guest}/accessRequest/`,
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
    path: `dashboard`,
  },
  surveyInfo: {
    key: 'surveyInfo',
    path: `surveyInfo`,
  },
  surveyList: {
    key: 'surveys',
    path: `surveys`,
  },
  surveyTemplateList: {
    key: 'surveyTemplateList',
    path: `surveyTemplates`,
  },
  surveyNew: {
    key: 'surveyNew',
    path: `surveyNew`,
  },
  templateList: {
    key: 'templates',
    path: `templates`,
  },
  templateNew: {
    key: 'templateNew',
    path: `templateNew`,
  },
  collectImportReport: {
    key: 'collectImportReport',
    path: `collectImportReport`,
  },
}

export const designerModules = {
  formDesigner: {
    key: 'formDesigner',
    path: `formDesigner`,
  },
  nodeDef: {
    key: 'nodeDef',
    path: `nodeDef`,
  },

  surveyHierarchy: {
    key: 'surveyHierarchy',
    path: `surveyHierarchy`,
  },
  categories: {
    key: 'categories',
    path: `categories`,
  },
  category: {
    key: 'category',
    path: `category`,
  },
  taxonomies: {
    key: 'taxonomies',
    path: `taxonomies`,
  },
  taxonomy: {
    key: 'taxonomy',
    path: `taxonomy`,
  },
}

export const dataModules = {
  record: {
    key: 'record',
    path: `record`,
  },
  recordValidationReport: {
    key: 'recordValidationReport',
    path: `recordValidationReport`,
  },
  records: {
    key: 'records',
    path: `records`,
  },
  explorer: {
    key: 'explorer',
    path: `explorer`,
  },
  map: {
    key: 'map',
    path: `map`,
  },
  export: {
    key: 'export',
    path: `export`,
  },
  import: {
    key: 'import',
    path: `import`,
  },
  validationReport: {
    key: 'validationReport',
    path: `validationReport`,
  },
}

export const userModules = {
  users: {
    key: 'users',
    path: `users`,
  },
  usersSurvey: {
    key: 'usersSurvey',
    path: `usersSurvey`,
  },
  user: {
    key: 'user',
    path: `user`,
  },
  userInvite: {
    key: 'userInvite',
    path: `userInvite`,
  },
  usersAccessRequest: {
    key: 'usersAccessRequest',
    path: `usersAccessRequest`,
  },
}

export const analysisModules = {
  chains: {
    key: 'chain_plural',
    path: `chains`,
  },
  chain: {
    key: 'chain',
    path: `chain`,
  },
  entities: {
    key: 'entities',
    path: `entities`,
  },
  nodeDef: {
    key: 'nodeDef',
    path: `nodeDef`,
  },
  category: {
    key: 'category',
    path: `category`,
  },
  instances: {
    key: 'instances',
    path: `instances`,
  },
}

export const helpModules = {
  userManual: {
    key: 'userManual',
    uri: 'https://docs.google.com/document/d/1GWerrExvbdT5oOOlwdkE9pptK4pVbQxwtgaSNPasmKA/view',
    external: true,
  },
}

export const app = 'app'
export const appModuleUri = (module = appModules.home) => `/${[app, module.path].join('/')}/`
