import { Authorizer } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as JobManager from '@server/job/jobManager'
import UnauthorizedError from '@server/utils/unauthorizedError'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'
import DataImportJob from './DataImportJob/DataImportJob'

/**
 * Checks that the user can use the specified Collect data import options (the UI offers them only to some users).
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user starting the import.
 * @param {!number} params.surveyId - The id of the survey.
 * @param {boolean} [params.deleteAllRecords] - Whether all the records of the cycle will be deleted before the import.
 * @returns {Promise<void>} - Resolves if the options are allowed.
 * @throws {UnauthorizedError} If the user cannot use the options.
 */
const checkCollectDataImportOptions = async ({ user, surveyId, deleteAllRecords = false }) => {
  if (!deleteAllRecords) return
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById({ surveyId }))
  if (!Authorizer.canEditSurvey(user, surveyInfo)) {
    throw new UnauthorizedError(User.getName(user))
  }
}

/**
 * Starts the import of the records of a Collect backup file.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user starting the import.
 * @param {!number} params.surveyId - The id of the survey.
 * @param {!string} params.filePath - The path of the Collect backup file.
 * @param {boolean} [params.deleteAllRecords] - Whether all the records of the cycle will be deleted before the import.
 * @param {string} [params.cycle] - The cycle to import the records into.
 * @param {boolean} [params.forceImport] - Whether to import data from a Collect survey with a different URI.
 * @returns {Promise<object>} - The started job.
 * @throws {UnauthorizedError} If the user cannot use the specified options.
 */
export const startCollectDataImportJob = async ({ user, surveyId, filePath, deleteAllRecords, cycle, forceImport }) => {
  await checkCollectDataImportOptions({ user, surveyId, deleteAllRecords })

  const job = new CollectDataImportJob({
    user,
    surveyId,
    filePath,
    deleteAllRecords,
    cycle,
    forceImport,
  })
  JobManager.enqueueJob(job)
  return job
}

/**
 * Checks that the user can use the specified flat data (CSV/Excel) import options: the UI offers some of them only to system admins.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user starting the import.
 * @param {boolean} [params.includeFiles] - Whether files are imported too.
 * @param {boolean} [params.deleteExistingEntities] - Whether the existing entities will be deleted.
 * @returns {void}
 * @throws {UnauthorizedError} If the user cannot use the options.
 */
export const checkFlatDataImportOptions = ({ user, includeFiles = false, deleteExistingEntities = false }) => {
  if ((includeFiles || deleteExistingEntities) && !User.isSystemAdmin(user)) {
    throw new UnauthorizedError(User.getName(user))
  }
}

export const startFlatDataImportJob = ({
  user,
  surveyId,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  fileFormat,
  cycle,
  nodeDefUuid,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
  includeFiles = false,
  deleteExistingEntities = false,
  abortOnErrors = true,
}) => {
  checkFlatDataImportOptions({ user, includeFiles, deleteExistingEntities })

  const jobParams = {
    user,
    surveyId,
    filePath,
    fileId,
    totalChunks,
    totalFileSize,
    fileFormat,
    cycle,
    nodeDefUuid,
    dryRun,
    insertNewRecords,
    insertMissingNodes,
    updateRecordsInAnalysis,
    includeFiles,
    deleteExistingEntities,
    abortOnErrors,
  }
  const job = dryRun ? new DataImportValidationJob(jobParams) : new DataImportJob(jobParams)
  JobManager.enqueueJob(job)
  return job
}
