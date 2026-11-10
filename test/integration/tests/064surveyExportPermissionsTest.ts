import * as fsp from 'node:fs/promises'

import { ArenaServer } from '@openforis/arena-server'

import * as AuthGroup from '@core/auth/authGroup'
import * as ProcessUtils from '@core/processUtils'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as AuthManager from '@server/modules/auth/manager/authManager'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import FileZip from '@server/utils/file/fileZip'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import { getContextUser } from '../config/context'

let survey: any
let recordUuid: string
let surveyManagerGroup: any
const createdSurveyIds: number[] = []

// the context user (system admin) with only the specified role in the survey
const userWithRole = (groupName: string) => {
  const group = Survey.getAuthGroupByName(groupName)(Survey.getSurveyInfo(survey))
  return { ...getContextUser(), authGroups: [group] }
}

// survey manager (can create surveys) with only the specified role (if any) in the survey
const surveyManagerWithRole = (groupName: string | null = null) => {
  const user = getContextUser()
  const surveyGroups = groupName ? userWithRole(groupName).authGroups : []
  // high quota: the context user owns the surveys created by the other tests
  return { ...user, props: { ...user.props, maxSurveys: 10000 }, authGroups: [surveyManagerGroup, ...surveyGroups] }
}

type Middleware = (req: any, res: any, next: any) => Promise<unknown>

const runMiddleware = async (middleware: Middleware, user: any, body: object = {}) => {
  const req = { params: { surveyId: String(Survey.getId(survey)) }, query: {}, body, user }
  const res: any = {
    statusCode: null,
    status: (code: number) => {
      res.statusCode = code
      return res
    },
    send: () => res,
  }
  const next = jest.fn()
  await middleware(req, res, next)
  return { res, next }
}

const runExportPermissionMiddleware = (user: any) => runMiddleware(AuthMiddleware.requireSurveyExportPermission, user)

// exports the survey requesting all the data and returns the path of the export file
const exportSurveyRequestingData = async (user: any): Promise<string> => {
  const job: any = await SurveyService.createSurveyExportJob({
    surveyId: Survey.getId(survey),
    user,
    includeData: true,
    includeResultAttributes: true,
    includeActivityLog: true,
  })
  await job.start()
  expect(job.isSucceeded()).toBe(true)
  return job.context.filePath
}

// exports the survey requesting all the data and returns the names of the exported entries and the export info
const exportSurveyWithData = async (user: any) => {
  const filePath = await exportSurveyRequestingData(user)
  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const entryNames: string[] = fileZip.getEntryNames({ onlyFirstLevel: false })
  const info = JSON.parse(fileZip.getEntryAsText(ExportFile.info))
  fileZip.close()
  await fsp.unlink(filePath)
  return { entryNames, info }
}

const dataDirs = ['records/', 'files/', 'users/', 'activitylog/']

const expectSurveyStructureCopied = async (surveyId: number) => {
  createdSurveyIds.push(surveyId)
  const surveyCopy = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true })
  expect(Survey.getNodeDefByName('cluster_no')(surveyCopy)).toBeTruthy()
}

// roles that can view the survey but cannot export its data
const viewerRoles = [
  AuthGroup.groupNames.surveyGuest,
  AuthGroup.groupNames.dataEditor,
  AuthGroup.groupNames.dataCleanser,
  AuthGroup.groupNames.dataAnalyst,
  AuthGroup.groupNames.surveyEditor,
]

describe('Survey export permissions', () => {
  beforeAll(async () => {
    // registers the services used by the export job (e.g. the download token one)
    ArenaServer.initServices()

    surveyManagerGroup = await AuthManager.fetchGroupByName({ name: AuthGroup.groupNames.surveyManager })

    const user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()

    const record = await RB.record(user, survey, RB.entity('cluster', RB.attribute('cluster_no', 1))).buildAndStore()
    recordUuid = Record.getUuid(record)
  })

  afterAll(async () => {
    for (const surveyId of createdSurveyIds) {
      await SurveyManager.deleteSurvey(surveyId) // NOSONAR
    }
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test.each([AuthGroup.groupNames.surveyGuest, AuthGroup.groupNames.dataEditor, AuthGroup.groupNames.dataCleanser])(
    '%s cannot export the survey',
    async (groupName) => {
      const { res, next } = await runExportPermissionMiddleware(userWithRole(groupName))
      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(403)
    }
  )

  test.each([AuthGroup.groupNames.dataAnalyst, AuthGroup.groupNames.surveyEditor, AuthGroup.groupNames.surveyAdmin])(
    '%s can export the survey',
    async (groupName) => {
      const { res, next } = await runExportPermissionMiddleware(userWithRole(groupName))
      expect(next).toHaveBeenCalledWith()
      expect(res.statusCode).toBeNull()
    }
  )

  test('data analyst gets the survey without records, users and activity log', async () => {
    const { entryNames, info } = await exportSurveyWithData(userWithRole(AuthGroup.groupNames.dataAnalyst))

    expect(entryNames).toContain(ExportFile.survey)
    expect(entryNames.filter((name) => dataDirs.some((dir) => name.startsWith(dir)))).toEqual([])
    expect(info.options).toMatchObject({ backup: false, includeActivityLog: false, includeResultAttributes: false })
  })

  test('survey admin gets the survey with records, users and activity log', async () => {
    const { entryNames, info } = await exportSurveyWithData(userWithRole(AuthGroup.groupNames.surveyAdmin))

    expect(entryNames).toEqual(
      expect.arrayContaining([
        ExportFile.survey,
        ExportFile.records,
        ExportFile.record({ recordUuid }),
        ExportFile.users,
        ExportFile.userInvitations,
      ])
    )
    expect(entryNames.some((name) => name.startsWith('activitylog/'))).toBe(!ProcessUtils.ENV.activityLogDisabled)
    expect(info.options).toMatchObject({ backup: true, includeActivityLog: true, includeResultAttributes: true })
  })

  test.each(viewerRoles)('survey manager with role %s can clone the survey', async (groupName) => {
    const user = surveyManagerWithRole(groupName)
    const body = { cloneFrom: Survey.getId(survey) }
    for (const middleware of [
      AuthMiddleware.requireSurveyCreatePermission,
      AuthMiddleware.requireSurveyCloneFromViewPermission,
    ]) {
      const { res, next } = await runMiddleware(middleware, user, body) // NOSONAR
      expect(next).toHaveBeenCalledWith()
      expect(res.statusCode).toBeNull()
    }

    const job: any = new SurveyCloneJob({ user, surveyId: Survey.getId(survey) })
    await job.start()
    expect(job.isSucceeded()).toBe(true)
    await expectSurveyStructureCopied(job.result.surveyId)
  })

  test('survey manager without a role in the survey cannot clone it', async () => {
    const body = { cloneFrom: Survey.getId(survey) }
    const { res, next } = await runMiddleware(
      AuthMiddleware.requireSurveyCloneFromViewPermission,
      surveyManagerWithRole(),
      body
    )
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
  })

  // the import "include data" option can be checked also for an export without data
  test.each([false, true])(
    'survey exported by a data analyst can be imported by a survey manager (include data: %s)',
    async (includeData) => {
      const filePath = await exportSurveyRequestingData(userWithRole(AuthGroup.groupNames.dataAnalyst))
      const job: any = new ArenaImportJob({ user: surveyManagerWithRole(), filePath, options: { includeData } })
      await job.start()
      expect(job.isSucceeded()).toBe(true)
      await expectSurveyStructureCopied(job.result.surveyId)
    }
  )
})
