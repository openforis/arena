import * as fsp from 'node:fs/promises'

import { JobStatus } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileUtils from '@server/utils/file/fileUtils'
import FileZip from '@server/utils/file/fileZip'
import UsersBackupExportJob from '@server/modules/user/service/usersBackup/UsersBackupExportJob'
import UsersBackupImportJob from '@server/modules/user/service/usersBackup/UsersBackupImportJob'
import { UsersBackupService } from '@server/modules/user/service/usersBackup/usersBackupService'
import {
  UsersBackupFile,
  UsersBackupUser,
  UsersBackupUserAction,
  usersBackupType,
} from '@server/modules/user/service/usersBackup/usersBackupModel'

import { getContextUser } from '../config/context'

const name = `users_backup_${Date.now()}`
const email = `${name}@openforis-arena.org`
const userGroupName = `${name}_group`

let surveyId: number
let surveyUuid: string
let userUuid: string
let backupFilePath: string

const setUserSurveyRole = async (groupName: string) => {
  await db.none(
    `DELETE FROM auth_group_user
    WHERE user_uuid = $1 AND group_uuid IN (SELECT uuid FROM auth_group WHERE survey_uuid = $2)`,
    [userUuid, surveyUuid]
  )
  await db.none(
    `INSERT INTO auth_group_user (user_uuid, group_uuid)
    SELECT $1, uuid FROM auth_group WHERE survey_uuid = $2 AND name = $3`,
    [userUuid, surveyUuid, groupName]
  )
}

const fetchUserState = async () => {
  const user = await db.oneOrNone(`SELECT uuid, name, password FROM "user" WHERE email = $1`, [email])
  if (!user) return null
  const surveyRoles = await db.map(
    `SELECT g.name FROM auth_group_user gu JOIN auth_group g ON g.uuid = gu.group_uuid
    WHERE gu.user_uuid = $1 AND g.survey_uuid = $2`,
    [user.uuid, surveyUuid],
    (row: any) => row.name
  )
  const userGroups = await db.map(
    `SELECT ug.props ->> 'name' AS name FROM user_group_user ugu JOIN user_group ug ON ug.uuid = ugu.group_uuid
    WHERE ugu.user_uuid = $1`,
    [user.uuid],
    (row: any) => row.name
  )
  return { ...user, surveyRoles, userGroups }
}

const copyBackupFile = async () => {
  const filePath = FileUtils.newTempFilePath()
  await fsp.copyFile(backupFilePath, filePath)
  return filePath
}

const runImport = async (action?: UsersBackupUserAction) => {
  // the import job deletes the imported file: work on a copy
  const filePath = await copyBackupFile()
  const actionsByEmail = action ? { [email]: action } : {}
  const job = new UsersBackupImportJob({ user: getContextUser(), filePath, actionsByEmail })
  await job.start()
  expect(job.status).toBe(JobStatus.succeeded)
  expect(FileUtils.exists(filePath)).toBeFalsy()
  return (job.result as any).summary
}

const findPreviewUser = async () => {
  const preview = await UsersBackupService.readImportPreview({ uploadedFilePath: await copyBackupFile() })
  await UsersBackupService.cancelImport({ tempFileName: preview.tempFileName })
  expect(FileUtils.exists(FileUtils.tempFilePath(preview.tempFileName))).toBeFalsy()
  return preview.users.find((user) => user.email === email)
}

describe('Users backup export/import', () => {
  beforeAll(async () => {
    const contextUser = getContextUser()
    const survey = await SurveyManager.insertSurvey({
      user: contextUser,
      surveyInfo: Survey.newSurvey({ ownerUuid: User.getUuid(contextUser), name, label: name, languages: ['en'] }),
      updateUserPrefs: false,
    })
    surveyId = Survey.getId(survey)
    surveyUuid = Survey.getUuid(Survey.getSurveyInfo(survey))

    userUuid = await db.one(
      `INSERT INTO "user" (name, email, password, status) VALUES ($1, $2, 'pwd_hash', '${User.userStatus.ACCEPTED}')
      RETURNING uuid`,
      [name, email],
      (row: any) => row.uuid
    )
    await setUserSurveyRole(AuthGroup.groupNames.dataEditor)
    const userGroupUuid = await db.one(
      `INSERT INTO user_group (survey_uuid, props) VALUES ($1, $2::jsonb) RETURNING uuid`,
      [surveyUuid, { name: userGroupName }],
      (row: any) => row.uuid
    )
    await db.none(`INSERT INTO user_group_user (user_uuid, group_uuid) VALUES ($1, $2)`, [userUuid, userGroupUuid])

    const exportJob = new UsersBackupExportJob({
      user: contextUser,
      includePasswords: true,
      serverUrl: 'https://arena-dev.example.org',
    })
    await exportJob.start()
    if (exportJob.status !== JobStatus.succeeded) throw new Error('users backup export failed')
    backupFilePath = FileUtils.tempFilePath((exportJob.result as any).outputFileName)
  })

  afterAll(async () => {
    await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: true })
    await db.none(`DELETE FROM "user" WHERE email = $1`, [email])
    if (backupFilePath && FileUtils.exists(backupFilePath)) {
      await fsp.unlink(backupFilePath)
    }
  })

  test('backup info contains type, server address and exporting user email', async () => {
    const fileZip = new FileZip(backupFilePath)
    await fileZip.init()
    const info = JSON.parse(fileZip.getEntryAsText(UsersBackupFile.info))
    fileZip.close()

    expect(info).toMatchObject({
      type: usersBackupType,
      serverUrl: 'https://arena-dev.example.org',
      exportedByUserEmail: User.getEmail(getContextUser()),
      includePasswords: true,
    })
  })

  test('backup contains the user with password, survey role and user group', async () => {
    const fileZip = new FileZip(backupFilePath)
    await fileZip.init()
    const users: UsersBackupUser[] = JSON.parse(fileZip.getEntryAsText(UsersBackupFile.users))
    fileZip.close()

    const user = users.find((u) => u.email === email)
    expect(user).toBeDefined()
    expect(user.password).toBe('pwd_hash')
    expect(user.authGroups).toContainEqual(
      expect.objectContaining({ name: AuthGroup.groupNames.dataEditor, surveyName: name })
    )
    expect(user.userGroups).toContainEqual({ name: userGroupName, surveyName: name })
  })

  test('preview tells if the user exists in this server', async () => {
    expect(await findPreviewUser()).toEqual({ email, name, existing: true })

    await db.none(`DELETE FROM "user" WHERE email = $1`, [email])
    expect((await findPreviewUser()).existing).toBe(false)
  })

  test('new user with skip action is not inserted', async () => {
    const summary = await runImport(UsersBackupUserAction.skip)

    expect(summary.usersSkipped).toBeGreaterThanOrEqual(1)
    expect(await fetchUserState()).toBeNull()
  })

  test('new user is inserted by default with same uuid, password, survey role and user group', async () => {
    const summary = await runImport()

    expect(summary.usersInserted).toBe(1)
    const user = await fetchUserState()
    expect(user.uuid).toBe(userUuid)
    expect(user.password).toBe('pwd_hash')
    expect(user.surveyRoles).toEqual([AuthGroup.groupNames.dataEditor])
    expect(user.userGroups).toEqual([userGroupName])
  })

  test('existing user is skipped by default; updateRoles replaces survey roles but not details', async () => {
    await setUserSurveyRole(AuthGroup.groupNames.surveyAdmin)
    await db.none(`UPDATE "user" SET name = 'changed' WHERE uuid = $1`, [userUuid])

    await runImport()
    let user = await fetchUserState()
    expect(user.surveyRoles).toEqual([AuthGroup.groupNames.surveyAdmin])

    await runImport(UsersBackupUserAction.updateRoles)
    user = await fetchUserState()
    expect(user.surveyRoles).toEqual([AuthGroup.groupNames.dataEditor])
    expect(user.name).toBe('changed')
  })

  test('updateAll updates also the user details', async () => {
    await runImport(UsersBackupUserAction.updateAll)
    expect((await fetchUserState()).name).toBe(name)
  })

  test('roles in surveys not existing in the target server are reported', async () => {
    await db.none(
      `UPDATE survey SET props = props || '{"name": "renamed"}'::jsonb, props_draft = props_draft || '{"name": "renamed"}'::jsonb WHERE id = $1`,
      [surveyId]
    )
    try {
      const summary = await runImport(UsersBackupUserAction.updateRoles)
      expect(summary.surveysNotFound).toContain(name)
      expect(summary.userGroupsNotFound).toContain(`${name} / ${userGroupName}`)
    } finally {
      await db.none(`UPDATE survey SET props_draft = props_draft || $2::jsonb WHERE id = $1`, [surveyId, { name }])
    }
  })

  test('invalid file is rejected by the preview and deleted', async () => {
    const uploadedFilePath = FileUtils.newTempFilePath()
    await fsp.writeFile(uploadedFilePath, 'not a zip')
    await expect(UsersBackupService.readImportPreview({ uploadedFilePath })).rejects.toThrow()
    expect(FileUtils.exists(uploadedFilePath)).toBeFalsy()
  })
})
