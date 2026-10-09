export const UsersBackupFile = {
  info: 'info.json',
  users: 'users.json',
  profilePicture: ({ userUuid }: { userUuid: string }) => `profilePictures/${userUuid}`,
}

export const usersBackupFormatVersion = 1

export enum UsersBackupConflictMode {
  // existing users (matched by email) are left untouched
  skip = 'skip',
  // existing users get the missing survey roles and user groups
  merge = 'merge',
  // like merge, but user details and survey roles are replaced with the ones in the backup
  overwrite = 'overwrite',
}

export type UsersBackupAuthGroup = {
  name: string
  surveyName?: string | null
  props?: Record<string, any> | null
}

export type UsersBackupUserGroup = {
  name: string
  surveyName: string
}

export type UsersBackupUser = {
  uuid: string
  email: string
  name?: string | null
  status: string
  props: Record<string, any>
  password?: string | null
  hasProfilePicture: boolean
  authGroups: UsersBackupAuthGroup[]
  userGroups: UsersBackupUserGroup[]
}

export type UsersBackupInfo = {
  formatVersion: number
  appVersion?: string
  dateExported: string
  exportedByUserUuid: string
  includePasswords: boolean
  usersCount: number
}

export type UsersBackupImportSummary = {
  dryRun: boolean
  usersTotal: number
  usersInserted: number
  usersUpdated: number
  usersSkipped: number
  authGroupsAdded: number
  userGroupsAdded: number
  surveysNotFound: string[]
  userGroupsNotFound: string[]
}
