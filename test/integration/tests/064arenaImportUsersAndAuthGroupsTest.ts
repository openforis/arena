import * as fsp from 'node:fs/promises'

import AdmZip from 'adm-zip'

import { ArenaServer } from '@openforis/arena-server'

import * as AuthGroup from '@core/auth/authGroup'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { uuidv4 } from '@core/uuid'

import { db } from '@server/db/db'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

// Users and auth groups in an Arena backup file are not trusted: survey groups are always the default ones,
// users are restored only when the importing user is a system admin.

const testId = Date.now()
const importerEmail = `arena_import_importer_${testId}@openforis-arena.org`
const archiveUserEmail = `arena_import_archive_user_${testId}@openforis-arena.org`

const sortNames = (names: string[]): string[] => [...names].sort((nameA, nameB) => nameA.localeCompare(nameB))

const defaultGroupNames = sortNames(Survey.getDefaultAuthGroups().map((group) => AuthGroup.getName(group)))

let sourceSurveyId: number
let sourceSurveyUuid: string
let backupFilePath: string
let importer: any
const createdSurveyIds: number[] = []

/**
 * Creates a copy of the backup file with additional survey auth groups and the specified users.
 * @param {object} params - The parameters.
 * @param {object[]} params.users - The users to write in the users file of the backup.
 * @returns {string} - The path of the new backup file.
 */
const createModifiedBackup = ({ users }: { users: object[] }): string => {
  const zip = new AdmZip(backupFilePath)
  const survey = JSON.parse(zip.readFile(ExportFile.survey).toString('utf8'))
  const surveyInfo = Survey.getSurveyInfo(survey)
  surveyInfo.authGroups = [
    ...Survey.getAuthGroups(surveyInfo),
    { name: AuthGroup.groupNames.systemAdmin, permissions: Object.values(AuthGroup.permissions), recordSteps: {} },
    { name: 'customGroup', permissions: [AuthGroup.permissions.recordView], recordSteps: {} },
  ]
  zip.addFile(ExportFile.survey, Buffer.from(JSON.stringify(survey)))
  zip.addFile(ExportFile.users, Buffer.from(JSON.stringify(users)))
  const filePath = FileUtils.newTempFilePath()
  zip.writeZip(filePath)
  return filePath
}

/**
 * Imports the specified backup file.
 * @param {object} params - The parameters.
 * @param {object} params.user - The user performing the import.
 * @param {string} params.filePath - The path of the backup file.
 * @returns {Promise<number>} - The id of the imported survey.
 */
const importBackup = async ({ user, filePath }: { user: any; filePath: string }): Promise<number> => {
  const job = new ArenaImportJob({ user, filePath })
  await job.start()
  expect(job.isSucceeded()).toBe(true)
  const { surveyId } = job.result as any
  createdSurveyIds.push(surveyId)
  return surveyId
}

const fetchSurveyGroupNames = async (surveyId: number): Promise<string[]> =>
  sortNames(
    await db.map(
      `SELECT g.name FROM auth_group g JOIN survey s ON s.uuid = g.survey_uuid WHERE s.id = $1`,
      [surveyId],
      (row: any) => row.name
    )
  )

const fetchUserGroupNameInSurvey = ({ userUuid, surveyId }: { userUuid: string; surveyId: number }) =>
  db.oneOrNone(
    `SELECT g.name FROM auth_group_user gu
    JOIN auth_group g ON g.uuid = gu.group_uuid
    JOIN survey s ON s.uuid = g.survey_uuid
    WHERE gu.user_uuid = $1 AND s.id = $2`,
    [userUuid, surveyId],
    (row: any) => row?.name ?? null
  )

const countUsersByEmail = (email: string): Promise<number> =>
  db.one(`SELECT COUNT(*) FROM "user" WHERE email = $1`, [email], (row: any) => Number(row.count))

describe('Arena backup import: users and auth groups', () => {
  beforeAll(async () => {
    // services used by SurveyExportJob (see 013surveyFilesExportImportTest)
    ArenaServer.initServices()

    const admin = getContextUser()
    const sourceSurvey = await SB.survey(
      admin,
      SB.entity('root_entity', SB.attribute('item_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()
    sourceSurveyId = Survey.getId(sourceSurvey)
    sourceSurveyUuid = Survey.getUuid(Survey.getSurveyInfo(sourceSurvey))

    const exportJob = new SurveyExportJob({ surveyId: sourceSurveyId, user: admin, backup: true })
    await exportJob.start()
    if (!exportJob.isSucceeded()) throw new Error('survey export failed')
    backupFilePath = (exportJob as any).context.filePath

    // survey manager: can create surveys, but is not a system admin
    const importerUuid = await db.one(
      `INSERT INTO "user" (name, email, password, status) VALUES ($1, $1, 'pwd_hash', '${User.userStatus.ACCEPTED}')
      RETURNING uuid`,
      [importerEmail],
      (row: any) => row.uuid
    )
    await db.none(
      `INSERT INTO auth_group_user (user_uuid, group_uuid)
      SELECT $1, uuid FROM auth_group WHERE name = $2 AND survey_uuid IS NULL`,
      [importerUuid, AuthGroup.groupNames.surveyManager]
    )
    importer = await UserManager.fetchUserByUuid(importerUuid)
  })

  afterAll(async () => {
    for (const surveyId of createdSurveyIds) {
      await SurveyManager.deleteSurvey(surveyId) // NOSONAR
    }
    if (sourceSurveyId) await SurveyManager.deleteSurvey(sourceSurveyId)
    await db.none(`DELETE FROM "user" WHERE email IN ($1, $2)`, [importerEmail, archiveUserEmail])
    if (backupFilePath && FileUtils.exists(backupFilePath)) {
      await fsp.unlink(backupFilePath)
    }
  })

  test('import by a non system admin: default survey groups only, users in the file not imported', async () => {
    const filePath = createModifiedBackup({
      users: [
        {
          uuid: uuidv4(),
          email: archiveUserEmail,
          name: 'archive user',
          password: 'pwd_hash',
          status: User.userStatus.ACCEPTED,
          authGroups: [{ name: AuthGroup.groupNames.systemAdmin }],
        },
      ],
    })
    const surveyId = await importBackup({ user: importer, filePath })

    expect(await fetchSurveyGroupNames(surveyId)).toEqual(defaultGroupNames)
    expect(await countUsersByEmail(archiveUserEmail)).toBe(0)

    const importerReloaded = await UserManager.fetchUserByUuid(User.getUuid(importer))
    expect(User.isSystemAdmin(importerReloaded)).toBe(false)
    expect(await fetchUserGroupNameInSurvey({ userUuid: User.getUuid(importer), surveyId })).toBe(
      AuthGroup.groupNames.surveyAdmin
    )
  })

  test('import by a system admin: default survey groups only, users in the file restored', async () => {
    const archiveUserUuid = uuidv4()
    const filePath = createModifiedBackup({
      users: [
        {
          uuid: archiveUserUuid,
          email: archiveUserEmail,
          name: 'archive user',
          status: User.userStatus.ACCEPTED,
          authGroups: [{ name: AuthGroup.groupNames.dataEditor, surveyUuid: sourceSurveyUuid }],
        },
      ],
    })
    const surveyId = await importBackup({ user: getContextUser(), filePath })

    expect(await fetchSurveyGroupNames(surveyId)).toEqual(defaultGroupNames)
    expect(await countUsersByEmail(archiveUserEmail)).toBe(1)
    expect(await fetchUserGroupNameInSurvey({ userUuid: archiveUserUuid, surveyId })).toBe(
      AuthGroup.groupNames.dataEditor
    )
  })
})
