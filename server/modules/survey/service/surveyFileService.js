import * as Log from '@server/log/log'
import * as SurveyRepository from '../repository/surveyRepository'
import * as SurveyFileManager from '../manager/surveyFileManager'

const logger = Log.getLogger('SurveyFileService')

export const checkFilesStorage = async () => {
  const storageType = SurveyFileManager.getFileContentStorageType()

  logger.debug(`Checking if files storage ${storageType} is accessible`)

  await SurveyFileManager.checkCanAccessFilesStorage()

  logger.debug(`Files storage ${storageType} is accessible!`)

  if (storageType === SurveyFileManager.fileContentStorageTypes.db) {
    return
  }
  logger.debug(`Moving survey files to new storage (if necessary)`)
  const surveyIds = await SurveyRepository.fetchAllSurveyIds()
  let allSurveysFilesMoved = false
  let errorsFound = false
  for (const surveyId of surveyIds) {
    try {
      const surveyFilesMoved = await SurveyFileManager.moveFilesToNewStorageIfNecessary({ surveyId })
      allSurveysFilesMoved = allSurveysFilesMoved || surveyFilesMoved
    } catch (error) {
      errorsFound = true
      logger.error(`Error moving files for survey ${surveyId}`, error)
    }
  }
  if (errorsFound) {
    logger.error(`There were errors moving survey files to the new storage`)
  } else if (allSurveysFilesMoved) {
    logger.debug(`Survey files moved successfully`)
  } else {
    logger.debug('Survey files move not necessary')
  }
}

export const fetchFilesStatistics = async ({ surveyId }) => {
  const totalSpace = await SurveyFileManager.fetchSurveyFilesTotalSpace({ surveyId })
  const { total: usedSpace } = await SurveyFileManager.fetchCountAndTotalFilesSize({ surveyId })
  const availableSpace = Math.max(0, totalSpace - usedSpace)

  return { availableSpace, totalSpace, usedSpace }
}

export const migrateAllSurveysFilesToNewPathFormat = async ({ logger: loggerParam = logger } = {}) => {
  const surveyIds = await SurveyRepository.fetchAllSurveyIds()
  let anyMigrated = false
  let errorsFound = false
  for (const surveyId of surveyIds) {
    try {
      const migrated = await SurveyFileManager.migrateFilesToNewPathFormat({ surveyId })
      anyMigrated = anyMigrated || migrated
    } catch (error) {
      errorsFound = true
      loggerParam.error(`Error migrating file paths for survey ${surveyId}`, error)
    }
  }
  if (errorsFound) {
    loggerParam.error('There were errors migrating survey files to new path format')
  } else if (anyMigrated) {
    loggerParam.debug('All survey files migrated to new path format successfully')
  } else {
    loggerParam.debug('Survey files path migration not necessary')
  }
}

export const cleanupAllSurveysFilesProps = async () => {
  const surveyIds = await SurveyRepository.fetchAllSurveyIds()
  let count = 0
  for (const surveyId of surveyIds) {
    const cleanedFiles = await SurveyFileManager.cleanupSurveyFilesProps({ surveyId })
    count += cleanedFiles
  }
  return count
}

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileContentAsStream,
  fetchFileContentAsBuffer,
  fetchFileSummaryByUuid,
  fetchFileSummariesBySurveyId,
  fetchFileSummariesByType,
  // UPDATE
  updateFileProps,
  // DELETE
  deleteFileByUuid,
  cleanupSurveyFilesProps,
} = SurveyFileManager
