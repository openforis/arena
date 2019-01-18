const {groupNames, permissions} = require('../../auth/authGroups')
const {keys: authGroupKeys} = require('../../auth/authGroups')

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const getDefaultAuthGroups = lang => [
  {
    name: groupNames.surveyAdmin,
    permissions: [
      permissions.permissionsEdit,
      permissions.surveyEdit,
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit,
      permissions.userInvite,
    ],
    labels: {[lang]: 'Survey administrators'},
    descriptions: {[lang]: `Full rights`},

    recordSteps: {
      '1': authGroupKeys.all,
      '2': authGroupKeys.all,
      '3': authGroupKeys.all,
    },
  },
  {
    name: groupNames.surveyEditor,
    permissions: [
      permissions.surveyEdit,
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit,
    ],
    labels: {en: 'Survey editors'},
    descriptions: {[lang]: `Can edit survey, records, invite users`},

    recordSteps: {
      '1': authGroupKeys.all,
      '2': authGroupKeys.all,
      '3': authGroupKeys.all,
    },
  },
  {
    name: groupNames.dataEditor,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit,
    ],
    labels: {en: 'Data editors'},
    descriptions: {[lang]: `Can edit records in data entry step`},

    recordSteps: {
      '1': authGroupKeys.own,
    },
  },
  {
    name: groupNames.dataCleanser,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit,
    ],
    labels: {en: 'Data cleansers'},
    descriptions: {[lang]: `Can edit records in data cleansing step`},

    recordSteps: {
      '1': authGroupKeys.all,
      '2': authGroupKeys.all,
    },
  },
  {
    name: groupNames.dataAnalyst,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordDataEdit,
    ],
    labels: {en: 'Data analysts'},
    descriptions: {[lang]: `Can edit records in data analysis step`},

    recordSteps: {
      '1': authGroupKeys.all,
      '2': authGroupKeys.all,
      '3': authGroupKeys.all,
    },
  }
]

module.exports = {
  defaultSteps,
  getDefaultAuthGroups,
}