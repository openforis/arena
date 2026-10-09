import { uuidv4 } from '@core/uuid'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as UsersBackupRepository from '@server/modules/user/repository/usersBackupRepository'
import type { AuthGroupRow, UserGroupRow } from '@server/modules/user/repository/usersBackupRepository'

import { UsersBackupFileReader } from './usersBackupFileReader'
import { UsersBackupImportSummary, UsersBackupUser, UsersBackupUserAction } from './usersBackupModel'

const surveyGroupKey = ({ surveyName, name }: { surveyName?: string | null; name: string }) => `${surveyName}|${name}`

const existingUserActions = new Set([UsersBackupUserAction.updateRoles, UsersBackupUserAction.updateAll])

/**
 * Imports the users exported with UsersBackupExportJob, performing on every user the action chosen in actionsByEmail
 * (by default new users are inserted and existing ones are skipped).
 * Users are matched by email; survey roles and user groups are matched by survey name and group name.
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

  async onStart() {
    await super.onStart()
    const { filePath } = this.context as any

    this.fileZip = await UsersBackupFileReader.open(filePath)

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
    const users = UsersBackupFileReader.readUsers(this.fileZip)

    this.total = users.length
    this.summary = {
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

  getUserAction({ user, existing }: { user: UsersBackupUser; existing: boolean }): UsersBackupUserAction {
    const { actionsByEmail = {} } = this.context as any
    const action: UsersBackupUserAction | undefined = actionsByEmail[user.email]
    if (existing) {
      return existingUserActions.has(action) ? action : UsersBackupUserAction.skip
    }
    return action === UsersBackupUserAction.skip ? UsersBackupUserAction.skip : UsersBackupUserAction.insert
  }

  async importUser(user: UsersBackupUser) {
    const existingUserUuid = await UsersBackupRepository.fetchUserUuidByEmail({ email: user.email }, this.tx)
    const action = this.getUserAction({ user, existing: Boolean(existingUserUuid) })

    if (action === UsersBackupUserAction.skip) {
      this.summary.usersSkipped += 1
      return
    }
    let userUuid = existingUserUuid
    if (action === UsersBackupUserAction.insert) {
      // keep the uuid of the source server when not already used
      const uuidUsed = await UsersBackupRepository.existsUserByUuid({ uuid: user.uuid }, this.tx)
      userUuid = uuidUsed ? uuidv4() : user.uuid
      await this.writeUser({ user, userUuid, insert: true })
    } else if (action === UsersBackupUserAction.updateAll) {
      await this.writeUser({ user, userUuid, insert: false })
    }
    const isNewUser = !existingUserUuid
    const groupsAdded = await this.importAuthGroups({ user, userUuid, isNewUser })
    const userGroupsAdded = await this.importUserGroups({ user, userUuid, isNewUser })

    if (isNewUser) {
      this.summary.usersInserted += 1
    } else if (action === UsersBackupUserAction.updateAll || groupsAdded + userGroupsAdded > 0) {
      this.summary.usersUpdated += 1
    } else {
      this.summary.usersSkipped += 1
    }
  }

  async writeUser({ user, userUuid, insert }: { user: UsersBackupUser; userUuid: string; insert: boolean }) {
    const profilePicture = user.hasProfilePicture
      ? UsersBackupFileReader.readProfilePicture(this.fileZip, user.uuid)
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

      // only one auth group per survey is allowed: replace the current one
      const otherSurveyGroupUuids = group.surveyUuid
        ? currentGroupUuids.filter((uuid) => this.authGroupsByUuid[uuid]?.surveyUuid === group.surveyUuid)
        : []
      if (otherSurveyGroupUuids.length > 0) {
        await UsersBackupRepository.deleteAuthGroupUsers({ userUuid, groupUuids: otherSurveyGroupUuids }, this.tx)
      }
      await UsersBackupRepository.insertAuthGroupUser(
        { userUuid, groupUuid: group.uuid, props: authGroup.props ?? null },
        this.tx
      )
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

      await UsersBackupRepository.insertUserGroupUser({ userUuid, groupUuid: group.uuid }, this.tx)
      added += 1
    }
    this.summary.userGroupsAdded += added
    return added
  }

  addNotFound(list: string[], item: string) {
    if (!list.includes(item)) list.push(item)
  }
}
