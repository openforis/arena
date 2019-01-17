const {groupNames, permissions} = require('../../auth/authGroups')

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const getDefaultAuthGroups = (lang) => [
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
    descriptions: {[lang]: `Full rights`},

    dataSteps: {'1': 'all', '2': 'all', '3': 'all'},
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
    descriptions: {[lang]: `Can edit survey, records, invite users`},

    dataSteps: {'1': 'all', '2': 'all', '3': 'all'},
  },
  {
    name: groupNames.dataEditor,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Data editors'},
    descriptions: {[lang]: `Can edit records in data entry step`},

    dataSteps: {'1': 'own'}
  },
  {
    name: groupNames.dataCleanser,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Data cleansers'},
    descriptions: {[lang]: `Can edit records in data cleansing step`},

    dataSteps: {'1': 'all', '2': 'all'},
  },
  {
    name: groupNames.dataAnalyst,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit
    ],
    labels: {en: 'Data analysts'},
    descriptions: {[lang]: `Can edit records in data analysis step`},

    dataSteps: {'1': 'all', '2': 'all', '3': 'all'},
  }
]

module.exports = {
  defaultSteps,
  getDefaultAuthGroups,
}