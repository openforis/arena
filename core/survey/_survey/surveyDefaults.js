import * as AuthGroup from '@core/auth/authGroup'

export const getDefaultAuthGroups = () => [
  {
    name: AuthGroup.groupNames.surveyAdmin,
    permissions: [...AuthGroup.permissionsByGroupName[AuthGroup.groupNames.surveyAdmin]],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
      3: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.surveyEditor,
    permissions: [...AuthGroup.permissionsByGroupName[AuthGroup.groupNames.surveyEditor]],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
      3: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.dataAnalyst,
    permissions: [...AuthGroup.permissionsByGroupName[AuthGroup.groupNames.dataAnalyst]],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
      3: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.dataCleanser,
    permissions: [...AuthGroup.permissionsByGroupName[AuthGroup.groupNames.dataCleanser]],
    recordSteps: {
      1: AuthGroup.keys.all,
      2: AuthGroup.keys.all,
    },
  },
  {
    name: AuthGroup.groupNames.dataEditor,
    permissions: [...AuthGroup.permissionsByGroupName[AuthGroup.groupNames.dataEditor]],
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

export const getSamplingPolygonDefaults = () => {
  return {
    lengthLatitude: 0,
    lengthLongitude: 0,
    numberOfPointsNorth: 0,
    numberOfPointsEast: 0,
    offsetNorth: 0,
    offsetEast: 0,
    controlPointOffsetNorth: 0,
    controlPointOffsetEast: 0,
    isCircle: true,
    radius: 0,
  }
}
