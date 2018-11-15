const permissions = {
  // surveys
  surveyCreate: 'surveyCreate',
  // only owner and administrator can delete survey
  // edit survey info props, edit nodeDefs, edit codeLists, edit taxonomies, publishSurvey
  surveyEdit: 'surveyEdit',

  // records
  recordCreate: 'recordCreate',
  recordDataEdit: 'recordDataEdit',
  recordView: 'recordView',

  // users
  userInvite: 'userInvite',

  // edit
  // only owner and admin - for now
  permissionsEdit: 'permissionsEdit',
}

const groupNames = {
  systemAdmin: 'systemAdmin',
  surveyAdmin: 'surveyAdmin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  guest: 'guest',
}

const getDefaultSurveyGroups = (surveyName, lang) => [
  {
    name: groupNames.surveyAdmin,
    permissions: [
      permissions.permissionsEdit,
      permissions.surveyEdit,
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit,
      permissions.userInvite
    ],
    labels: {[lang]: 'Survey administrators'},
    descriptions: {[lang]: `Administrators of the ${surveyName} survey`},
  },
  {
    name: groupNames.surveyEditor,
    permissions: [
      permissions.surveyEdit,
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Survey editors'},
    descriptions: {[lang]: `Editors of the ${surveyName} survey`},
  },
  {
    name: groupNames.dataEditor,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Data editors'},
    descriptions: {[lang]: `Data editors of the ${surveyName} survey`},
  },
  {
    name: groupNames.dataCleanser,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Data cleansers'},
    descriptions: {[lang]: `Data cleansers of the ${surveyName} survey`},
  },
  {
    name: groupNames.dataAnalyst,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Data analysts'},
    descriptions: {[lang]: `Data analysts of the ${surveyName} survey`},
  }
]

module.exports = {
  groupNames,
  getDefaultSurveyGroups
}
