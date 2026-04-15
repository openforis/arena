import { Schemata, SurveyDocxGenerator } from '@openforis/arena-server'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as DbUtils from '@server/db/dbUtils'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as FileService from '@server/modules/record/service/fileService'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import * as Response from '@server/utils/response'

import * as SurveyManager from '../manager/surveyManager'
import SurveyCloneJob from './clone/surveyCloneJob'
import SurveyPublishJob from './publish/surveyPublishJob'
import { SchemaSummary } from './schemaSummary'
import SurveyActivityLogClearJob from './surveyActivityLogClearJob'
import SurveyExportJob from './surveyExport/surveyExportJob'
import { SurveyLabelsExport } from './surveyLabelsExport'
import SurveyLabelsImportJob from './surveyLabelsImportJob'
import SurveysListExportJob from './SurveysListExportJob'
import SurveyUnpublishJob from './unpublish/surveyUnpublishJob'

const dbMaxAvailableSpace = 1024 * 1024 * 1024 * 5 // 4GB

export const fetchAndAssocStorageInfo = async ({ survey }) => {
  const surveyId = Survey.getId(survey)
  const filesStatistics = await FileService.fetchFilesStatistics({ surveyId })
  const schema = Schemata.getSchemaSurvey(surveyId)
  const schemaTablesSize = await DbUtils.fetchSchemaTablesSize({ schema })
  const dbStatistics = { usedSpace: schemaTablesSize, totalSpace: dbMaxAvailableSpace }
  const activityLogSize = await ActivityLogManager.fetchTableSize({ surveyId })
  return A.pipe(
    Survey.assocFilesStatistics(filesStatistics),
    Survey.assocDbStatistics(dbStatistics),
    Survey.assocActivityLogSize(activityLogSize)
  )(survey)
}

// JOBS
export const startPublishJob = ({ user, surveyId, cleanupRecords }) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyPublishJob({ user, surveyId, cleanupRecords })

  JobManager.enqueueJob(job)

  return job
}

export const startUnpublishJob = (user, surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyUnpublishJob({ user, surveyId })

  JobManager.enqueueJob(job)

  return job
}

export const startDeleteActivityLogJob = (user, surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyActivityLogClearJob({ user, surveyId })

  JobManager.enqueueJob(job)

  return job
}

export const exportSurvey = ({
  surveyId,
  user,
  includeData = false,
  includeResultAttributes = true,
  includeActivityLog = true,
}) => {
  const outputFileName = `survey_export_${surveyId}_${Date.now()}.zip`
  const job = new SurveyExportJob({
    surveyId,
    user,
    outputFileName,
    backup: includeData,
    includeResultAttributes,
    includeActivityLog,
  })

  JobManager.enqueueJob(job)

  return { job: JobUtils.jobToJSON(job) }
}

export const startSurveysListExport = ({ user, draft, template }) => {
  const job = new SurveysListExportJob({ user, draft, template })

  JobManager.enqueueJob(job)

  return job
}

export const cloneSurvey = ({ user, surveyId, surveyInfoTarget, cycle = null }) => {
  const job = new SurveyCloneJob({ user, surveyId, surveyInfoTarget, cycle })
  JobManager.enqueueJob(job)
  return JobUtils.jobToJSON(job)
}

export const exportSchemaSummary = async ({ surveyId, cycle, outputStream, fileFormat }) =>
  SchemaSummary.exportSchemaSummary({ surveyId, cycle, outputStream, fileFormat })

export const exportLabels = async ({ surveyId, outputStream, fileFormat }) =>
  SurveyLabelsExport.exportLabels({ surveyId, outputStream, fileFormat })

export const exportSurveyDocx = async ({ surveyId, cycle, lang, draft = true, outputStream }) => {
  const survey = await fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    cycle,
    draft,
    advanced: false,
    includeDeleted: false,
    includeAnalysis: false,
  })
  const { buffer, surveyName } = await SurveyDocxGenerator.generateSurveyDocx({ survey, cycle, lang })
  const fileName = ExportFileNameGenerator.generate({
    surveyName,
    cycle,
    fileType: 'SurveyForm',
    extension: 'docx',
  })
  const fileSize = Buffer.byteLength(buffer)
  Response.sendFileContent({
    res: outputStream,
    fileName,
    content: buffer,
    contentSize: fileSize,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export const deleteSurvey = async (surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  await SurveyManager.deleteSurvey(surveyId)
}

export const startLabelsImportJob = ({ user, surveyId, filePath, fileFormat }) => {
  const job = new SurveyLabelsImportJob({ user, surveyId, filePath, fileFormat })
  return JobManager.enqueueJob(job)
}

export const {
  // CREATE
  insertSurvey,
  // READ
  fetchUserSurveysInfo,
  countOwnedSurveys,
  countUserSurveys,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  fetchSurveyAndNodeDefsAndRefDataBySurveyId,
  // UPDATE
  updateSurveyDependencyGraphs,
  updateSurveyProps,
  updateSurveyConfigurationProp,
  updateSurveyOwner,
  // DELETE
  deleteTemporarySurveys,
  // UTILS
  validateNewSurvey,
  validateSurveyClone,
  validateSurveyImportFromCollect,
} = SurveyManager
