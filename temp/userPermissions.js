const permissions = {
  surveyCreate: 'surveyCreate',
  // only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit categories, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  recordCreate: 'recordCreate',
  recordEdit: 'recordEdit',
  recordView: 'recordView',

  userInvite: 'userInvite',

  // only owner and admin - for now
  permissionsEdit: 'permissionsEdit',
}

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const rolesKey = {
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
}

const roles = {
  [rolesKey.surveyAdmin]: {
    labels: {},
    descriptions: {},
    permissions: [
      permissions.permissionsEdit,
      permissions.surveyEdit,
      permissions.recordView, permissions.recordCreate, permissions.recordEdit,
      permissions.userInvite,
    ],
    recordSteps: ['1', '2', '3'],
  },

  [rolesKey.surveyEditor]: {
    labels: {},
    descriptions: {},
    permissions: [permissions.surveyEdit, permissions.recordView, permissions.recordCreate, permissions.recordEdit],
    recordSteps: ['1', '2', '3'],
  },

  [rolesKey.dataEditor]: {
    labels: {},
    descriptions: {},
    permissions: [permissions.recordView, permissions.recordCreate, permissions.recordEdit],
    recordSteps: [{'1': 'owned'}],
  },

  [rolesKey.dataCleanser]: {
    labels: {},
    descriptions: {},
    permissions: [permissions.recordView, permissions.recordCreate, permissions.recordEdit],
    recordSteps: [{'1': 'all'}, {'2': 'all'}],
  },

  [rolesKey.dataAnalyst]: {
    labels: {},
    descriptions: {},
    permissions: [permissions.recordView, permissions.recordCreate, permissions.recordEdit],
    recordSteps: [{'1': 'all'}, {'2': 'all'}, {'3': 'all'}],
  },
}

const systemAdminGroup = {
  labels: {en: 'System Administrators'},
  descriptions: {en: 'OF Arena system administrators'},
  role: null,
  dataCondition: null,

  // table group_user
  userIds: [1, 2, 3, 4],
}

const group = {
  labels: {en: 'Administrators'},
  descriptions: {en: 'Administrators of the Survey(s) x, x1, x3'},
  role: 'surveyAdmin',
  dataCondition: null,

  // table group_survey
  // surveyIds: [1, 2, 3, 4],
  // table group_user
  // userIds: [1, 2, 3, 4],
}

const defaultSurveyGroups = [
  {
    role: rolesKey.surveyAdmin,
    labels: {en: ''},
    descriptions: {en: ''},
    dataCondition: null,
  },
  {
    role: rolesKey.surveyEditor,
    labels: {en: ''},
    descriptions: {en: ''},
    dataCondition: null,
  },
  {
    role: rolesKey.dataEditor,
    labels: {en: ''},
    descriptions: {en: ''},
    dataCondition: null,
  },
  {
    role: rolesKey.dataCleanser,
    labels: {en: ''},
    descriptions: {en: ''},
    dataCondition: null,
  },
  {
    role: rolesKey.dataAnalyst,
    labels: {en: ''},
    descriptions: {en: ''},
    dataCondition: null,
  }
]
