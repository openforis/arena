import AdmZip from 'adm-zip'

import { ArenaServer } from '@openforis/arena-server'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

// the survey name and the spatial reference systems in an Arena backup file are not trusted

let backupFilePath: string = null
const createdSurveyIds: number[] = []

const createBackupWithSurveyProps = (props: Record<string, unknown>): string => {
  const zip = new AdmZip(backupFilePath)
  const survey = JSON.parse(zip.readFile(ExportFile.survey).toString('utf8'))
  const surveyInfo = Survey.getSurveyInfo(survey)
  surveyInfo.props = { ...surveyInfo.props, ...props }
  surveyInfo.propsDraft = { ...surveyInfo.propsDraft, ...props }
  zip.addFile(ExportFile.survey, Buffer.from(JSON.stringify(survey)))
  const filePath = FileUtils.newTempFilePath()
  zip.writeZip(filePath)
  return filePath
}

const importBackup = async (filePath: string) => {
  const job: any = new ArenaImportJob({ user: getContextUser(), filePath })
  await job.start()
  const surveyId = job.result?.surveyId
  if (surveyId) {
    createdSurveyIds.push(surveyId)
  }
  return job
}

describe('Arena import: survey name and spatial reference systems', () => {
  beforeAll(async () => {
    // services used by SurveyExportJob (see 013surveyFilesExportImportTest)
    ArenaServer.initServices()

    const survey = await SB.survey(
      getContextUser(),
      SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()
    createdSurveyIds.push(Survey.getId(survey))

    const exportJob: any = new SurveyExportJob({ surveyId: Survey.getId(survey), user: getContextUser(), backup: true })
    await exportJob.start()
    if (!exportJob.isSucceeded()) throw new Error('survey export failed')
    backupFilePath = exportJob.context.filePath
  })

  afterAll(async () => {
    for (const surveyId of createdSurveyIds) {
      await SurveyManager.deleteSurvey(surveyId) // NOSONAR
    }
  })

  test('the survey name is normalized', async () => {
    const job = await importBackup(createBackupWithSurveyProps({ name: '../My Survey 2026!' }))
    expect(job.isSucceeded()).toBe(true)
    const survey = await SurveyManager.fetchSurveyById({ surveyId: job.result.surveyId, draft: true })
    expect(Survey.getName(Survey.getSurveyInfo(survey))).toMatch(/^___my_survey_2026_/)
  })

  test('a survey with spatial reference system codes that are not EPSG codes is not imported', async () => {
    const job = await importBackup(createBackupWithSurveyProps({ srs: [{ code: "4326'", name: 'WGS 84' }] }))
    expect(job.isSucceeded()).toBe(false)
    expect(JSON.stringify(job.errors)).toContain('survey.srsCodeInvalid')
  })
})
