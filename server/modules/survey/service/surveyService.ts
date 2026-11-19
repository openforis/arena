import type { Response as ExpressResponse } from 'express'
import { Schemata, SurveyDocxGenerator, SurveyPdfGenerator } from '@openforis/arena-server'
import {
  NodeDefExpressionEvaluator,
  SurveyDocImages,
  SurveyDocPlace,
  type ArenaSurveyDocImage,
  type ArenaUser,
  type ArenaSurvey,
  type ArenaSurveyFile,
} from '@openforis/arena-core'

import * as i18nFactory from '@core/i18n/i18nFactory'
import * as A from '@core/arena'
import { canExportSurveyData } from '@core/auth/surveyExportAuthorizer'
import { parseAreaOfInterestJson } from '@core/geo/areaOfInterestParser'
import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import SystemError, { StatusCodes } from '@core/systemError'

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
import SurveyCreatorJob from './surveyCreateJob'
import SurveyPublishJob from './publish/surveyPublishJob'
import { checkPublishRecordValuesUpdateWarning } from './publish/recordValuesUpdateWarning'
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

export const fetchAndAssocStorageInfo = async ({ survey }: { survey: ArenaSurvey }) => {
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

export const startPublishJob = async ({
  user,
  surveyId,
  cleanupRecords,
  updateRecordValues,
  skipDataUpdate = false,
}: {
  user: ArenaUser
  surveyId: number
  cleanupRecords: boolean
  updateRecordValues: boolean
  skipDataUpdate?: boolean
}) => {
  if (!updateRecordValues && !skipDataUpdate) {
    const recordValuesUpdateWarning = await checkPublishRecordValuesUpdateWarning({ surveyId })
    if (recordValuesUpdateWarning) {
      return { recordValuesUpdateWarning }
    }
  }

  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyPublishJob({ user, surveyId, cleanupRecords, updateRecordValues, skipDataUpdate })

  JobManager.enqueueJob(job)

  return { job }
}

export const startUnpublishJob = (user: ArenaUser, surveyId: number) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyUnpublishJob({ user, surveyId })

  JobManager.enqueueJob(job)

  return job
}

export const startDeleteActivityLogJob = (user: ArenaUser, surveyId: number) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyActivityLogClearJob({ user, surveyId })

  JobManager.enqueueJob(job)

  return job
}

/**
 * Creates (without starting it) the survey export job.
 * Records, users and activity log are included only if requested and if the user can export the survey data.
 * @param {object} params - The export parameters.
 * @param {number} params.surveyId - The id of the survey to export.
 * @param {object} params.user - The user performing the export.
 * @param {string} [params.outputFileName] - The name of the export file (generated automatically if not specified).
 * @param {boolean} [params.includeData] - If true, records, users and activity log are requested.
 * @param {boolean} [params.includeResultAttributes] - If true, result attributes values are requested.
 * @param {boolean} [params.includeActivityLog] - If true, users and activity log are requested.
 * @returns {Promise<SurveyExportJob>} - The export job.
 */
export const createSurveyExportJob = async ({
  surveyId,
  user,
  outputFileName = undefined,
  includeData = false,
  includeResultAttributes = true,
  includeActivityLog = true,
}: {
  surveyId: number
  user: ArenaUser
  outputFileName?: string
  includeData?: boolean
  includeResultAttributes?: boolean
  includeActivityLog?: boolean
}) => {
  const surveyInfo = await SurveyManager.fetchSurveyById({ surveyId })
  const canExportData = canExportSurveyData(user, surveyInfo)
  return new SurveyExportJob({
    surveyId,
    user,
    outputFileName,
    backup: includeData && canExportData,
    includeResultAttributes: includeResultAttributes && canExportData,
    includeActivityLog: includeActivityLog && canExportData,
  })
}

/**
 * Starts the survey export job (see createSurveyExportJob).
 * @param {object} params - The export parameters (see createSurveyExportJob).
 * @returns {Promise<{job: object}>} - The started job, serialized.
 */
export const exportSurvey = async (params: {
  surveyId: number
  user: ArenaUser
  includeData?: boolean
  includeResultAttributes?: boolean
  includeActivityLog?: boolean
}) => {
  const { surveyId } = params
  const outputFileName = `survey_export_${surveyId}_${Date.now()}.zip`
  const job = await createSurveyExportJob({ ...params, outputFileName })

  JobManager.enqueueJob(job)

  return { job: JobUtils.jobToJSON(job) }
}

export const startSurveysListExport = ({
  user,
  draft,
  template,
}: {
  user: ArenaUser
  draft: boolean
  template: boolean
}) => {
  const job = new SurveysListExportJob({ user, draft, template })

  JobManager.enqueueJob(job)

  return job
}

export const cloneSurvey = ({
  user,
  surveyId,
  surveyInfoTarget,
  cycle = null,
}: {
  user: ArenaUser
  surveyId: number
  surveyInfoTarget: ArenaSurvey
  cycle?: string
}) => {
  const job = new SurveyCloneJob({ user, surveyId, surveyInfoTarget, cycle })
  JobManager.enqueueJob(job)
  return JobUtils.jobToJSON(job)
}

export const startCreateSurveyJob = ({ user, surveyInfo }: { user: ArenaUser; surveyInfo: ArenaSurvey }) => {
  const job = new SurveyCreatorJob({ user, surveyInfo })
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
export const startNodeDefsTranslationJob = ({ user, surveyId }: { user: ArenaUser; surveyId: number }) => {
  const job = new NodeDefsTranslationJob({ user, surveyId })
  JobManager.enqueueJob(job)
  return job
}

export const startSchemaSummaryExportJob = ({
  user,
  surveyId,
  cycle,
  fileFormat,
  includeAiDescriptions = false,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  fileFormat: string
  includeAiDescriptions?: boolean
}) => {
  const job = new SchemaSummaryExportJob({ user, surveyId, cycle, fileFormat, includeAiDescriptions })
  JobManager.enqueueJob(job)
  return job
}

export const exportLabels = ({
  surveyId,
  outputStream,
  fileFormat,
}: {
  surveyId: number
  outputStream: ExpressResponse
  fileFormat: string
}) => SurveyLabelsExport.exportLabels({ surveyId, outputStream, fileFormat })

const isSurveyDocImageApplicable = async ({
  user,
  survey,
  imageFile,
}: {
  user: ArenaUser
  survey: ArenaSurvey
  imageFile: ArenaSurveyDocImage
}) => {
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
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  outputStream: ExpressResponse
  lang: string
  draft: boolean
  generator: typeof SurveyPdfGenerator.generateSurveyPdf | typeof SurveyDocxGenerator.generateSurveyDocx
  extension: string
  contentType: string
}) => {
  const survey = await fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    cycle,
    draft,
    advanced: false,
    includeDeleted: false,
    includeAnalysis: false,
  })
  const surveyDocImages = Survey.getSurveyDocImages(survey) as ArenaSurveyDocImage[]
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
    fileProvider: async (fileUuid: string) => {
      const fileSummary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid)
      return SurveyFileService.fetchFileContentAsBuffer({ surveyId, fileSummary })
    },
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

export const exportSurveyDocx = ({
  user,
  surveyId,
  cycle,
  outputStream,
  lang = null,
  draft = true,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  outputStream: ExpressResponse
  lang?: string
  draft?: boolean
}) =>
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

export const exportSurveyPdf = ({
  user,
  surveyId,
  cycle,
  outputStream,
  lang = null,
  draft = true,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  outputStream: ExpressResponse
  lang?: string
  draft?: boolean
}) =>
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

export const deleteSurvey = async (surveyId: number) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  await SurveyManager.deleteSurvey(surveyId)
}

export const startLabelsImportJob = ({
  user,
  surveyId,
  filePath,
  fileFormat,
}: {
  user: ArenaUser
  surveyId: number
  filePath: string
  fileFormat: string
}) => {
  const job = new SurveyLabelsImportJob({ user, surveyId, filePath, fileFormat })
  return JobManager.enqueueJob(job)
}

const checkAreaOfInterestFileContent = (content: Buffer) => {
  if (!parseAreaOfInterestJson(content.toString('utf8'))) {
    throw new SystemError(Validation.messageKeys.surveyInfoEdit.areaOfInterestInvalid, {}, StatusCodes.BAD_REQUEST)
  }
}

export const insertSurveyFile = async ({
  surveyId,
  filePath,
  surveyFile,
}: {
  surveyId: number
  filePath: string
  surveyFile: ArenaSurveyFile
}) => {
  const content = await FileUtils.readBinaryFile(filePath)
  if (SurveyFile.getType(surveyFile) === SurveyFile.SurveyFileType.areaOfInterest) {
    checkAreaOfInterestFileContent(content)
  }
  const surveyFileToStore = { ...surveyFile, content }
  await SurveyFileManager.insertFile(surveyId, surveyFileToStore)
}

export const fetchSurveyFile = async ({ surveyId, fileUuid }: { surveyId: number; fileUuid: string }) => {
  const summary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid)
  const contentStream = summary
    ? await SurveyFileManager.fetchFileContentAsStream({ surveyId, fileSummary: summary })
    : null
  if (!contentStream) {
    throw new SystemError('appErrors:survey.fileNotFound', { fileUuid }, StatusCodes.NOT_FOUND)
  }
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
