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
  }
]

module.exports = {
  defaultSteps,
  getDefaultAuthGroups,
}