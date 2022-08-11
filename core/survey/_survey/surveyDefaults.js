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
    length_latitude: 0,
    length_longitude: 0,
    number_of_points_north: 0,
    number_of_points_east: 0,
    offset_north: 0,
    offset_east: 0,
    controlpoint_offset_north: 0,
    controlpoint_offset_east: 0,
    isCircle: true,
    radius: 0,
  }
}
