import * as UsersBackupRepository from '@server/modules/user/repository/usersBackupRepository'
import type {
  AuthGroupMembershipRow,
  UserGroupMembershipRow,
} from '@server/modules/user/repository/usersBackupRepository'

import { UsersBackupPreviewRoles, UsersBackupPreviewUser, UsersBackupUser } from './usersBackupModel'
import { groupByUserUuid, surveyGroupKey } from './usersBackupUtils'

const byName = (a: { surveyName: string }, b: { surveyName: string }) => a.surveyName.localeCompare(b.surveyName)

const toPreviewRoles = ({
  authGroups,
  userGroups,
  existingSurveyNames = null,
  existingUserGroupKeys = null,
}: {
  authGroups: { name: string; surveyName?: string | null }[]
  userGroups: { name: string; surveyName: string }[]
  existingSurveyNames?: Set<string> | null
  existingUserGroupKeys?: Set<string> | null
}): UsersBackupPreviewRoles => ({
  mainRoles: authGroups.filter((group) => !group.surveyName).map((group) => group.name),
  surveyRoles: authGroups
    .filter((group) => group.surveyName)
    .map(({ name, surveyName }) => ({
      surveyName,
      role: name,
      ...(existingSurveyNames ? { surveyExists: existingSurveyNames.has(surveyName) } : {}),
    }))
    .sort(byName),
  userGroups: userGroups
    .map(({ name, surveyName }) => ({
      surveyName,
      name,
      ...(existingUserGroupKeys
        ? { groupExists: existingUserGroupKeys.has(surveyGroupKey({ surveyName, name })) }
        : {}),
    }))
    .sort(byName),
})

const toCurrentRoles = ({
  authGroups = [],
  userGroups = [],
}: {
  authGroups?: AuthGroupMembershipRow[]
  userGroups?: UserGroupMembershipRow[]
}): UsersBackupPreviewRoles =>
  toPreviewRoles({
    authGroups: authGroups.map(({ groupName, surveyName }) => ({ name: groupName, surveyName })),
    userGroups: userGroups.map(({ groupName, surveyName }) => ({ name: groupName, surveyName })),
  })

// For every user in the backup: if it exists in this server, its roles in the backup and the ones already defined here.
export const buildUsersBackupPreviewUsers = async (users: UsersBackupUser[]): Promise<UsersBackupPreviewUser[]> => {
  const existingUsers = await UsersBackupRepository.fetchUserUuidsByEmails({ emails: users.map((user) => user.email) })
  const existingUserUuidByEmail = new Map(existingUsers.map(({ email, uuid }) => [email, uuid]))

  const existingSurveyNames = new Set(
    (await UsersBackupRepository.fetchAuthGroups()).map((group) => group.surveyName).filter(Boolean)
  )
  const existingUserGroupKeys = new Set((await UsersBackupRepository.fetchUserGroups()).map(surveyGroupKey))
  const currentAuthGroupsByUserUuid = groupByUserUuid(await UsersBackupRepository.fetchAuthGroupMembershipsForBackup())
  const currentUserGroupsByUserUuid = groupByUserUuid(await UsersBackupRepository.fetchUserGroupMembershipsForBackup())

  return users.map((user) => {
    const { email, name, authGroups = [], userGroups = [] } = user
    const existingUserUuid = existingUserUuidByEmail.get(email)
    return {
      email,
      name,
      existing: Boolean(existingUserUuid),
      backup: toPreviewRoles({ authGroups, userGroups, existingSurveyNames, existingUserGroupKeys }),
      current: existingUserUuid
        ? toCurrentRoles({
            authGroups: currentAuthGroupsByUserUuid[existingUserUuid],
            userGroups: currentUserGroupsByUserUuid[existingUserUuid],
          })
        : null,
    }
  })
}
