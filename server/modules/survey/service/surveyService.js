import { Schemata, SurveyDocxGenerator, SurveyPdfGenerator } from '@openforis/arena-server'
import { NodeDefExpressionEvaluator, SurveyDocImages, SurveyDocPlace } from '@openforis/arena-core'

import * as i18nFactory from '@core/i18n/i18nFactory'
import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as DbUtils from '@server/db/dbUtils'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import * as Response from '@server/utils/response'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '../manager/surveyManager'
import * as SurveyFileManager from '../manager/surveyFileManager'
import SurveyCloneJob from './clone/surveyCloneJob'
import SurveyPublishJob from './publish/surveyPublishJob'
import { SchemaSummaryExportJob } from './schemaSummary'
import SurveyActivityLogClearJob from './surveyActivityLogClearJob'
import SurveyExportJob from './surveyExport/surveyExportJob'
import { SurveyLabelsExport } from './surveyLabelsExport'
import NodeDefsTranslationJob from './NodeDefsTranslationJob'
import SurveyLabelsImportJob from './surveyLabelsImportJob'
import SurveysListExportJob from './SurveysListExportJob'
import SurveyUnpublishJob from './unpublish/surveyUnpublishJob'
import { findSurveyDocImageApplicable } from './surveyDocImageUtils'

const dbMaxAvailableSpace = 1024 * 1024 * 1024 * 5 // 4GB

export const fetchAndAssocStorageInfo = async ({ survey }) => {
  const surveyId = Survey.getId(survey)
  const filesStatistics = await SurveyFileService.fetchFilesStatistics({ surveyId })
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

/**
 * Starts the node definitions AI translation job.
 * @param {object} params - Params.
 * @param {object} params.user - Acting user.
 * @param {number} params.surveyId - Survey id.
 * @returns {object} The enqueued job.
 */
export const startNodeDefsTranslationJob = ({ user, surveyId }) => {
  const job = new NodeDefsTranslationJob({ user, surveyId })
  JobManager.enqueueJob(job)
  return job
}

export const startSchemaSummaryExportJob = ({ user, surveyId, cycle, fileFormat, includeAiDescriptions = false }) => {
  const job = new SchemaSummaryExportJob({ user, surveyId, cycle, fileFormat, includeAiDescriptions })
  JobManager.enqueueJob(job)
  return job
}

export const exportLabels = async ({ surveyId, outputStream, fileFormat }) =>
  SurveyLabelsExport.exportLabels({ surveyId, outputStream, fileFormat })

const isSurveyDocImageApplicable = async ({ user, survey, imageFile }) => {
  const applyIf = SurveyDocImages.getApplyIf(imageFile)
  if (!applyIf) return true
  try {
    const nodeDef = Survey.getNodeDefRoot(survey)
    const result = await new NodeDefExpressionEvaluator().evalExpression({ user, survey, expression: applyIf, nodeDef })
    return result === true
  } catch {
    return false
  }
}

const exportSurveyDocument = async ({
  user,
  surveyId,
  cycle,
  outputStream,
  lang,
  draft,
  generator,
  extension,
  contentType,
}) => {
  const survey = await fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    cycle,
    draft,
    advanced: false,
    includeDeleted: false,
    includeAnalysis: false,
  })
  const surveyDocImages = Survey.getSurveyDocImages(survey)
  const langToUse = lang ?? Survey.getDefaultLanguage(survey)

  const headerImageFileSummary = await findSurveyDocImageApplicable({
    surveyDocImages,
    documentPlace: SurveyDocPlace.header,
    isApplicable: (imageFile) => isSurveyDocImageApplicable({ user, survey, imageFile }),
  })
  const footerImageFileSummary = await findSurveyDocImageApplicable({
    surveyDocImages,
    documentPlace: SurveyDocPlace.footer,
    isApplicable: (imageFile) => isSurveyDocImageApplicable({ user, survey, imageFile }),
  })

  const headerOnFirstPageOnly = Survey.isDocHeaderOnFirstPageOnly(survey)
  const pageNumbering = Survey.isDocPageNumberingEnabled(survey)
  const i18n = await i18nFactory.createI18nAsync(langToUse)
  const { buffer, surveyName } = await generator({
    survey,
    cycle,
    lang: langToUse,
    i18n,
    fileProvider: async (fileUuid) => SurveyFileService.fetchFileContentAsBuffer({ surveyId, fileUuid }),
    headerImageFileUuid: headerImageFileSummary?.uuid,
    footerImageFileUuid: footerImageFileSummary?.uuid,
    headerOnFirstPageOnly,
    pageNumbering,
  })
  const fileName = ExportFileNameGenerator.generate({ surveyName, cycle, fileType: 'SurveyForm', extension })
  Response.sendFileContent({
    res: outputStream,
    fileName,
    content: buffer,
    contentSize: Buffer.byteLength(buffer),
    contentType,
  })
}

export const exportSurveyDocx = ({ user, surveyId, cycle, outputStream, lang = null, draft = true }) =>
  exportSurveyDocument({
    user,
    surveyId,
    cycle,
    outputStream,
    lang,
    draft,
    generator: SurveyDocxGenerator.generateSurveyDocx,
    extension: 'docx',
    contentType: Response.contentTypes.docx,
  })

export const exportSurveyPdf = ({ user, surveyId, cycle, outputStream, lang = null, draft = true }) =>
  exportSurveyDocument({
    user,
    surveyId,
    cycle,
    outputStream,
    lang,
    draft,
    generator: SurveyPdfGenerator.generateSurveyPdf,
    extension: 'pdf',
    contentType: Response.contentTypes.pdf,
  })

export const deleteSurvey = async (surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  await SurveyManager.deleteSurvey(surveyId)
}

export const startLabelsImportJob = ({ user, surveyId, filePath, fileFormat }) => {
  const job = new SurveyLabelsImportJob({ user, surveyId, filePath, fileFormat })
  return JobManager.enqueueJob(job)
}

export const insertSurveyFile = async ({ surveyId, filePath, surveyFile }) => {
  const content = await FileUtils.readBinaryFile(filePath)
  const surveyFileToStore = { ...surveyFile, content }
  await SurveyFileManager.insertFile(surveyId, surveyFileToStore)
}

export const fetchSurveyFile = async ({ surveyId, fileUuid }) => {
  const summary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid)
  const contentStream = await SurveyFileManager.fetchFileContentAsStream({ surveyId, fileUuid })
  return { summary, contentStream }
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
