import * as AuthGroup from '@core/auth/authGroup'

export const getDefaultAuthGroups = () => [
  {
    name: AuthGroup.groupNames.surveyAdmin,
    permissions: [
      AuthGroup.permissions.permissionsEdit,
      AuthGroup.permissions.surveyCreate,
      AuthGroup.permissions.surveyEdit,
      AuthGroup.permissions.recordView,
      AuthGroup.permissions.recordCreate,
      AuthGroup.permissions.recordEdit,
      AuthGroup.permissions.recordCleanse,
      AuthGroup.permissions.recordAnalyse,
      AuthGroup.permissions.userEdit,
      AuthGroup.permissions.userInvite,
    ],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
      3: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.surveyEditor,
    permissions: [
      AuthGroup.permissions.surveyEdit,
      AuthGroup.permissions.recordView,
      AuthGroup.permissions.recordCreate,
      AuthGroup.permissions.recordEdit,
      AuthGroup.permissions.recordCleanse,
      AuthGroup.permissions.recordAnalyse,
    ],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
      3: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.dataAnalyst,
    permissions: [
      AuthGroup.permissions.recordView,
      AuthGroup.permissions.recordCreate,
      AuthGroup.permissions.recordEdit,
      AuthGroup.permissions.recordCleanse,
      AuthGroup.permissions.recordAnalyse,
    ],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
      3: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.dataCleanser,
    permissions: [
      AuthGroup.permissions.recordView,
      AuthGroup.permissions.recordCreate,
      AuthGroup.permissions.recordEdit,
      AuthGroup.permissions.recordCleanse,
    ],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.dataEditor,
    permissions: [
      AuthGroup.permissions.recordView,
      AuthGroup.permissions.recordCreate,
      AuthGroup.permissions.recordEdit,
    ],
    recordSteps: {
      1: AuthGroup.keys.own,
    },
  },
  // ,
  // {
  //   name: AuthGroup.groupNames.surveyGuest,
  //   labels: {[lang]: 'Survey guest'},
  //   descriptions: {[lang]: `Can view records`},
  // },
]
