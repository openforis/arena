const AuthGroups = require('../../auth/authGroups')

const getDefaultAuthGroups = () => [
  {
    name: AuthGroups.groupNames.surveyAdmin,
    permissions: [
      AuthGroups.permissions.permissionsEdit,
      AuthGroups.permissions.surveyEdit,
      AuthGroups.permissions.recordView,
      AuthGroups.permissions.recordCreate,
      AuthGroups.permissions.recordEdit,
      AuthGroups.permissions.userInvite,
    ],
    recordSteps: {
      '1': AuthGroups.keys.all,
      '2': AuthGroups.keys.all,
      '3': AuthGroups.keys.all,
    },
  },
  {
    name: AuthGroups.groupNames.surveyEditor,
    permissions: [
      AuthGroups.permissions.surveyEdit,
      AuthGroups.permissions.recordView,
      AuthGroups.permissions.recordCreate,
      AuthGroups.permissions.recordEdit,
    ],
    recordSteps: {
      '1': AuthGroups.keys.all,
      '2': AuthGroups.keys.all,
      '3': AuthGroups.keys.all,
    },
  },
  {
    name: AuthGroups.groupNames.dataAnalyst,
    permissions: [
      AuthGroups.permissions.recordView,
      AuthGroups.permissions.recordCreate,
      AuthGroups.permissions.recordEdit,
    ],
    recordSteps: {
      '1': AuthGroups.keys.all,
      '2': AuthGroups.keys.all,
      '3': AuthGroups.keys.all,
    },
  },
  {
    name: AuthGroups.groupNames.dataCleanser,
    permissions: [
      AuthGroups.permissions.recordView,
      AuthGroups.permissions.recordCreate,
      AuthGroups.permissions.recordEdit,
    ],
    recordSteps: {
      '1': AuthGroups.keys.all,
      '2': AuthGroups.keys.all,
    },
  },
  {
    name: AuthGroups.groupNames.dataEditor,
    permissions: [
      AuthGroups.permissions.recordView,
      AuthGroups.permissions.recordCreate,
      AuthGroups.permissions.recordEdit,
    ],
    recordSteps: {
      '1': AuthGroups.keys.own,
    },
  },
  // ,
  // {
  //   name: AuthGroups.groupNames.surveyGuest,
  //   labels: {[lang]: 'Survey guest'},
  //   descriptions: {[lang]: `Can view records`},
  // },
]

module.exports = {
  getDefaultAuthGroups,
}