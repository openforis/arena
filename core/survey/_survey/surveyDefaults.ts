import type { AuthGroup as ArenaAuthGroup } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'

// group names and record step values are the same strings as the arena-core AuthGroupName and RecordStepPermission enums
export const getDefaultAuthGroups = (): ArenaAuthGroup[] =>
  [
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
    {
      name: AuthGroup.groupNames.surveyGuest,
      permissions: [...AuthGroup.permissionsByGroupName[AuthGroup.groupNames.surveyGuest]],
      recordSteps: {
        3: AuthGroup.keys.all,
      },
    },
  ] as ArenaAuthGroup[]
