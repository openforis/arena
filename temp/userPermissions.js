const permissions = {
  surveyCreate: 'surveyCreate',
  // only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit codeLists, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  recordCreate: 'recordCreate',
  recordDataEdit: 'recordDataEdit',
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

const roles = {

  'surveyAdmin': {
    labels: {},
    descriptions: {},
    permissions: [
      permissions.permissionsEdit,
      permissions.surveyEdit,
      permissions.recordView, permissions.recordCreate, permissions.recordDataEdit,
      permissions.userInvite
    ],
    dataSteps: ['1', '2', '3']
  },

  'surveyEditor': {
    labels: {},
    descriptions: {},
    permissions: [permissions.surveyEdit, permissions.recordView, permissions.recordCreate, permissions.recordDataEdit],
    dataSteps: ['1', '2', '3']
  },

  'dataEditor': {
    labels: {},
    descriptions: {},
    permissions: [permissions.recordView, permissions.recordCreate, permissions.recordDataEdit],
    dataSteps: [{'1': 'owned'}],
  },

  'dataCleanser': {
    labels: {},
    descriptions: {},
    permissions: [permissions.recordView, permissions.recordCreate, permissions.recordDataEdit],
    dataSteps: [{'1': 'all'}, {'2': 'all'}],
  },

  'dataAnalyst': {
    labels: {},
    descriptions: {},
    permissions: [permissions.recordView, permissions.recordCreate, permissions.recordDataEdit],
    dataSteps: [{'1': 'all'}, {'2': 'all'}, {'3': 'all'}],
  },
}

const group = {
  labels: {en: 'Administrators'},
  descriptions: {en: 'Administrators of the Survey(s) x, x1, x3'},
  role: 'surveyAdmin',
  dataCondition: null,

  // table group_survey
  surveyIds: [1, 2, 3, 4],
  // table group_user
  userIds: [1, 2, 3, 4],
}
