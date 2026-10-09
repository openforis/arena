export const UsersBackupFile = {
  info: 'info.json',
  users: 'users.json',
  profilePicture: ({ userUuid }: { userUuid: string }) => `profilePictures/${userUuid}`,
}

// identifies the content of the zip file
export const usersBackupType = 'arenaUsersBackup'

export const usersBackupFormatVersion = 1

// action to perform on a single user when restoring a backup
export enum UsersBackupUserAction {
  // new users only
  insert = 'insert',
  skip = 'skip',
  // existing users only: add the survey roles and user groups in the backup
  // (a different role in the same survey is replaced)
  updateRoles = 'updateRoles',
  // existing users only: like updateRoles, but user details (name, password, status, title, picture) are updated too
  updateAll = 'updateAll',
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
  type: string
  formatVersion: number
  appVersion?: string
  // address of the server that generated the backup (e.g. dev, qa or prod)
  serverUrl?: string
  dateExported: string
  // email identifies the user across servers (uuids can differ)
  exportedByUserEmail: string
  exportedByUserUuid: string
  includePasswords: boolean
  usersCount: number
}

export type UsersBackupPreviewUser = {
  email: string
  name?: string | null
  existing: boolean
}

export type UsersBackupPreview = {
  tempFileName: string
  info: Pick<UsersBackupInfo, 'serverUrl' | 'dateExported' | 'exportedByUserEmail' | 'includePasswords'>
  users: UsersBackupPreviewUser[]
}

export type UsersBackupImportSummary = {
  usersTotal: number
  usersInserted: number
  usersUpdated: number
  usersSkipped: number
  authGroupsAdded: number
  userGroupsAdded: number
  surveysNotFound: string[]
  userGroupsNotFound: string[]
}
