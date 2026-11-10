import * as fsp from 'node:fs/promises'

import { ArenaServer } from '@openforis/arena-server'

import * as AuthGroup from '@core/auth/authGroup'
import * as ProcessUtils from '@core/processUtils'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import FileZip from '@server/utils/file/fileZip'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import { getContextUser } from '../config/context'

let survey: any
let recordUuid: string

// the context user (system admin) with only the specified role in the survey
const userWithRole = (groupName: string) => {
  const group = Survey.getAuthGroupByName(groupName)(Survey.getSurveyInfo(survey))
  return { ...getContextUser(), authGroups: [group] }
}

const runExportPermissionMiddleware = async (user: any) => {
  const req = { params: { surveyId: String(Survey.getId(survey)) }, query: {}, body: {}, user }
  const res: any = {
    statusCode: null,
    status: (code: number) => {
      res.statusCode = code
      return res
    },
    send: () => res,
  }
  const next = jest.fn()
  await AuthMiddleware.requireSurveyExportPermission(req, res, next)
  return { res, next }
}

// exports the survey requesting all the data and returns the names of the exported entries and the export info
const exportSurveyWithData = async (user: any) => {
  const job: any = await SurveyService.createSurveyExportJob({
    surveyId: Survey.getId(survey),
    user,
    includeData: true,
    includeResultAttributes: true,
    includeActivityLog: true,
  })
  await job.start()
  expect(job.isSucceeded()).toBe(true)

  const { filePath } = job.context
  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const entryNames: string[] = fileZip.getEntryNames({ onlyFirstLevel: false })
  const info = JSON.parse(fileZip.getEntryAsText(ExportFile.info))
  fileZip.close()
  await fsp.unlink(filePath)
  return { entryNames, info }
}

const dataDirs = ['records/', 'files/', 'users/', 'activitylog/']

describe('Survey export permissions', () => {
  beforeAll(async () => {
    // registers the services used by the export job (e.g. the download token one)
    ArenaServer.initServices()

    const user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()

    const record = await RB.record(user, survey, RB.entity('cluster', RB.attribute('cluster_no', 1))).buildAndStore()
    recordUuid = Record.getUuid(record)
  })

  afterAll(async () => {
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
})
