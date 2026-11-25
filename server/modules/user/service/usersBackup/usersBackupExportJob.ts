import type { JobParams } from '@server/job/job'
import { AppInfo } from '@core/app/appInfo'
import * as User from '@core/user/user'

import ZipFileCreatorBaseJob, { type ZipFileCreatorJobContext } from '@server/job/zipFileCreatorBaseJob'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as UsersBackupRepository from '@server/modules/user/repository/usersBackupRepository'

import {
  UsersBackupFile,
  UsersBackupInfo,
  UsersBackupUser,
  usersBackupFormatVersion,
  usersBackupType,
} from './usersBackupModel'
import { groupByUserUuid } from './usersBackupUtils'

/**
 * Exports all the users (or only the ones with the specified emails) (with their survey roles and user groups) into a zip file
 * that can be imported into another Arena server with UsersBackupImportJob.
 * 2FA devices, sessions, tokens, invitations and preferences are not exported.
 */
interface UsersBackupExportJobContext extends ZipFileCreatorJobContext {
  includePasswords?: boolean
  emails?: string[] | null
  serverUrl?: string
}

export default class UsersBackupExportJob extends ZipFileCreatorBaseJob<UsersBackupExportJobContext> {
  static readonly type = 'UsersBackupExportJob'

  constructor(params: Partial<JobParams>) {
    // temp file name must be a uuid to be accepted by the download endpoint
    super(UsersBackupExportJob.type, { outputFileName: FileUtils.newTempFileName(), ...params })
  }

  async execute() {
    const { archive, user, includePasswords = true, emails = null, serverUrl } = this.context
    const { tx } = this

    const users = await UsersBackupRepository.fetchUsersForBackup({ includePasswords, emails }, tx)
    this.total = users.length

    const authGroupsByUserUuid = groupByUserUuid(await UsersBackupRepository.fetchAuthGroupMembershipsForBackup(tx))
    const userGroupsByUserUuid = groupByUserUuid(await UsersBackupRepository.fetchUserGroupMembershipsForBackup(tx))

    const usersBackup: UsersBackupUser[] = []
    for (const userRow of users) {
      if (this.isCanceled()) return

      const { uuid, hasProfilePicture } = userRow
      usersBackup.push({
        ...userRow,
        authGroups: (authGroupsByUserUuid[uuid] ?? []).map(({ groupName, surveyName, props }) => ({
          name: groupName,
          surveyName,
          props,
        })),
        userGroups: (userGroupsByUserUuid[uuid] ?? []).map(({ groupName, surveyName }) => ({
          name: groupName,
          surveyName,
        })),
      })
      if (hasProfilePicture) {
        const profilePicture = await UserRepository.fetchUserProfilePicture(uuid, tx) // NOSONAR
        archive.append(profilePicture, { name: UsersBackupFile.profilePicture({ userUuid: uuid }) })
      }
      this.incrementProcessedItems()
    }
    archive.append(JSON.stringify(usersBackup, null, 2), { name: UsersBackupFile.users })

    const info: UsersBackupInfo = {
      type: usersBackupType,
      formatVersion: usersBackupFormatVersion,
      appVersion: AppInfo.currentAppInfo?.version,
      serverUrl,
      dateExported: new Date().toISOString(),
      exportedByUserEmail: User.getEmail(user),
      exportedByUserUuid: User.getUuid(user),
      includePasswords,
      usersCount: usersBackup.length,
    }
    archive.append(JSON.stringify(info, null, 2), { name: UsersBackupFile.info })
  }
}
