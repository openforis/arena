import SystemError from '@core/systemError'
import { uuidv4 } from '@core/uuid'

import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as UsersBackupRepository from '@server/modules/user/repository/usersBackupRepository'
import type { AuthGroupRow, UserGroupRow } from '@server/modules/user/repository/usersBackupRepository'

import {
  UsersBackupConflictMode,
  UsersBackupFile,
  UsersBackupImportSummary,
  UsersBackupInfo,
  UsersBackupUser,
  usersBackupFormatVersion,
} from './usersBackupModel'

const surveyGroupKey = ({ surveyName, name }: { surveyName?: string | null; name: string }) => `${surveyName}|${name}`

const readJsonEntry = (fileZip: any, entryName: string) => {
  const content = fileZip.getEntryAsText(entryName)
  return content ? JSON.parse(content) : null
}

/**
 * Imports the users exported with UsersBackupExportJob.
 * Users are matched by email; survey roles and user groups are matched by survey name and group name.
 * With dryRun, nothing is written and only the summary of the changes is generated.
 */
export default class UsersBackupImportJob extends Job {
  static readonly type = 'UsersBackupImportJob'

  fileZip: any = null
  authGroupsByKey: Record<string, AuthGroupRow> = {}
  authGroupsByUuid: Record<string, AuthGroupRow> = {}
  userGroupsByKey: Record<string, UserGroupRow> = {}
  summary: UsersBackupImportSummary

  constructor(params: any) {
    super(UsersBackupImportJob.type, params)
  }

  get dryRun(): boolean {
    return Boolean((this.context as any).dryRun)
  }

  get conflictMode(): UsersBackupConflictMode {
    return (this.context as any).conflictMode ?? UsersBackupConflictMode.skip
  }

  async onStart() {
    await super.onStart()
    const { filePath } = this.context as any

    this.fileZip = new FileZip(filePath)
    await this.fileZip.init()

    const info: UsersBackupInfo | null = readJsonEntry(this.fileZip, UsersBackupFile.info)
    if (!info || info.formatVersion !== usersBackupFormatVersion) {
      throw new SystemError('usersBackupImport.invalidFile')
    }

    const authGroups = await UsersBackupRepository.fetchAuthGroups(this.tx)
    for (const group of authGroups) {
      this.authGroupsByKey[surveyGroupKey(group)] = group
      this.authGroupsByUuid[group.uuid] = group
    }
    const userGroups = await UsersBackupRepository.fetchUserGroups(this.tx)
    for (const group of userGroups) {
      this.userGroupsByKey[surveyGroupKey(group)] = group
    }
  }

  async execute() {
    const users: UsersBackupUser[] = readJsonEntry(this.fileZip, UsersBackupFile.users) ?? []

    this.total = users.length
    this.summary = {
      dryRun: this.dryRun,
      usersTotal: users.length,
      usersInserted: 0,
      usersUpdated: 0,
      usersSkipped: 0,
      authGroupsAdded: 0,
      userGroupsAdded: 0,
      surveysNotFound: [],
      userGroupsNotFound: [],
    }

    for (const user of users) {
      if (this.isCanceled()) return
      await this.importUser(user)
      this.incrementProcessedItems()
    }
    this.summary.surveysNotFound.sort((a, b) => a.localeCompare(b))
    this.summary.userGroupsNotFound.sort((a, b) => a.localeCompare(b))

    this.result = { summary: this.summary }
  }

  async onEnd() {
    await super.onEnd()
    this.fileZip?.close()
    // the uploaded backup contains password hashes: don't keep it in the temp folder
    const { filePath } = this.context as any
    if (filePath && FileUtils.exists(filePath)) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }

  async importUser(user: UsersBackupUser) {
    const existingUserUuid = await UsersBackupRepository.fetchUserUuidByEmail({ email: user.email }, this.tx)

    if (existingUserUuid && this.conflictMode === UsersBackupConflictMode.skip) {
      this.summary.usersSkipped += 1
      return
    }
    let userUuid: string
    let detailsUpdated = false
    if (existingUserUuid) {
      userUuid = existingUserUuid
      if (this.conflictMode === UsersBackupConflictMode.overwrite) {
        await this.writeUser({ user, userUuid, insert: false })
        detailsUpdated = true
      }
    } else {
      // keep the uuid of the source server when not already used
      const uuidUsed = await UsersBackupRepository.existsUserByUuid({ uuid: user.uuid }, this.tx)
      userUuid = uuidUsed ? uuidv4() : user.uuid
      await this.writeUser({ user, userUuid, insert: true })
    }
    const groupsAdded = await this.importAuthGroups({ user, userUuid, isNewUser: !existingUserUuid })
    const userGroupsAdded = await this.importUserGroups({ user, userUuid, isNewUser: !existingUserUuid })

    if (!existingUserUuid) {
      this.summary.usersInserted += 1
    } else if (detailsUpdated || groupsAdded + userGroupsAdded > 0) {
      this.summary.usersUpdated += 1
    } else {
      this.summary.usersSkipped += 1
    }
  }

  async writeUser({ user, userUuid, insert }: { user: UsersBackupUser; userUuid: string; insert: boolean }) {
    if (this.dryRun) return

    const profilePicture = user.hasProfilePicture
      ? this.fileZip.getEntryData(UsersBackupFile.profilePicture({ userUuid: user.uuid }))
      : null
    const values = {
      uuid: userUuid,
      name: user.name ?? null,
      password: user.password ?? null,
      status: user.status,
      props: user.props ?? {},
      profilePicture,
    }
    if (insert) {
      await UsersBackupRepository.insertUser({ ...values, email: user.email }, this.tx)
    } else {
      await UsersBackupRepository.updateUser(values, this.tx)
    }
  }

  findAuthGroup(authGroup: UsersBackupUser['authGroups'][number]): AuthGroupRow | null {
    const group = this.authGroupsByKey[surveyGroupKey(authGroup)]
    if (!group && authGroup.surveyName) {
      this.addNotFound(this.summary.surveysNotFound, authGroup.surveyName)
    }
    return group ?? null
  }

  async importAuthGroups({
    user,
    userUuid,
    isNewUser,
  }: {
    user: UsersBackupUser
    userUuid: string
    isNewUser: boolean
  }): Promise<number> {
    const currentGroupUuids = isNewUser
      ? []
      : await UsersBackupRepository.fetchUserAuthGroupUuids({ userUuid }, this.tx)
    let added = 0
    for (const authGroup of user.authGroups ?? []) {
      const group = this.findAuthGroup(authGroup)
      if (!group || currentGroupUuids.includes(group.uuid)) continue

      // only one auth group per survey is allowed
      const otherSurveyGroupUuids = group.surveyUuid
        ? currentGroupUuids.filter((uuid) => this.authGroupsByUuid[uuid]?.surveyUuid === group.surveyUuid)
        : []
      if (otherSurveyGroupUuids.length > 0) {
        if (this.conflictMode !== UsersBackupConflictMode.overwrite) continue
        if (!this.dryRun) {
          await UsersBackupRepository.deleteAuthGroupUsers({ userUuid, groupUuids: otherSurveyGroupUuids }, this.tx)
        }
      }
      if (!this.dryRun) {
        await UsersBackupRepository.insertAuthGroupUser(
          { userUuid, groupUuid: group.uuid, props: authGroup.props ?? null },
          this.tx
        )
      }
      added += 1
    }
    this.summary.authGroupsAdded += added
    return added
  }

  async importUserGroups({
    user,
    userUuid,
    isNewUser,
  }: {
    user: UsersBackupUser
    userUuid: string
    isNewUser: boolean
  }): Promise<number> {
    const currentGroupUuids = isNewUser
      ? []
      : await UsersBackupRepository.fetchUserUserGroupUuids({ userUuid }, this.tx)
    let added = 0
    for (const userGroup of user.userGroups ?? []) {
      const group = this.userGroupsByKey[surveyGroupKey(userGroup)]
      if (!group) {
        this.addNotFound(this.summary.userGroupsNotFound, `${userGroup.surveyName} / ${userGroup.name}`)
        continue
      }
      if (currentGroupUuids.includes(group.uuid)) continue

      if (!this.dryRun) {
        await UsersBackupRepository.insertUserGroupUser({ userUuid, groupUuid: group.uuid }, this.tx)
      }
      added += 1
    }
    this.summary.userGroupsAdded += added
    return added
  }

  addNotFound(list: string[], item: string) {
    if (!list.includes(item)) list.push(item)
  }
}
