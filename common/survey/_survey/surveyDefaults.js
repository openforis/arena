const { groupNames, permissions } = require('../../auth/authGroups')
const { keys: authGroupKeys } = require('../../auth/authGroups')

const getDefaultAuthGroups = () => [
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