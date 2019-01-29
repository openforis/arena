const { groupNames, permissions } = require('../../auth/authGroups')
const { keys: authGroupKeys } = require('../../auth/authGroups')

const getDefaultAuthGroups = lang => [
  {
    name: groupNames.surveyAdmin,
    permissions: [
      permissions.permissionsEdit,
      permissions.surveyEdit,
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordEdit,
      permissions.userInvite,
    ],
    labels: { [lang]: 'Survey administrators' },
    descriptions: { [lang]: `Full rights` },

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
      permissions.recordEdit,
    ],
    labels: { [lang]: 'Survey editors' },
    descriptions: { [lang]: `Can edit survey, records, invite users` },

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
      permissions.recordEdit,
    ],
    labels: { [lang]: 'Data editors' },
    descriptions: { [lang]: `Can edit records in data entry step` },

    recordSteps: {
      '1': authGroupKeys.own,
    },
  },
  {
    name: groupNames.dataCleanser,
    permissions: [
      permissions.recordView,
      permissions.recordCreate,
      permissions.recordEdit,
    ],
    labels: { [lang]: 'Data cleansers' },
    descriptions: { [lang]: `Can edit records in data cleansing step` },

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
      permissions.recordEdit,
    ],
    labels: { [lang]: 'Data analysts' },
    descriptions: { [lang]: `Can edit records in data analysis step` },

    recordSteps: {
      '1': authGroupKeys.all,
      '2': authGroupKeys.all,
      '3': authGroupKeys.all,
    },
  }
  // ,
  // {
  //   name: groupNames.surveyGuest,
  //   labels: {[lang]: 'Survey guest'},
  //   descriptions: {[lang]: `Can view records`},
  // },
]

module.exports = {
  getDefaultAuthGroups,
}