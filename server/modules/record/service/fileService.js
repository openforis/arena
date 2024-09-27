import { Promises } from '@openforis/arena-core'

import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileManager from '../manager/fileManager'

const logger = Log.getLogger('FileService')

const defaultSurveyFilesTotalSpaceMB = 10 * 1024 // in MB (=10 GB)

export const checkFilesStorage = async () => {
  const storageType = FileManager.getFileContentStorageType()

  logger.debug(`Checking if files storage ${storageType} is accessible`)

  await FileManager.checkCanAccessFilesStorage()

  logger.debug(`Files storage ${storageType} is accessible!`)

  if (storageType === FileManager.fileContentStorageTypes.db) {
    return
  }
  logger.debug(`Moving survey files to new storage (if necessary)`)
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  let allSurveysFilesMoved = false
  let errorsFound = false
  await Promises.each(surveyIds, async (surveyId) => {
    try {
      const surveyFilesMoved = await FileManager.moveFilesToNewStorageIfNecessary({ surveyId })
      allSurveysFilesMoved = allSurveysFilesMoved || surveyFilesMoved
    } catch (error) {
      errorsFound = true
      logger.error(`Error moving files for survey ${surveyId}`, error)
    }
  })
  if (errorsFound) {
    logger.error(`There were errors moving survey files to the new storage`)
  } else if (allSurveysFilesMoved) {
    logger.debug(`Survey files moved successfully`)
  } else {
    logger.debug('Survey files move not necessary')
  }
}

const getSurveyFilesTotalSpace = async ({ surveyId }) => {
  const surveyTotalSpaceMB = await SurveyManager.fetchFilesTotalSpace(surveyId)
  const totalSpaceMB = surveyTotalSpaceMB ?? defaultSurveyFilesTotalSpaceMB
  return totalSpaceMB * 1024 * 1024 // from MB to bytes
}

export const fetchFilesStatistics = async ({ surveyId }) => {
  const totalSpace = await getSurveyFilesTotalSpace({ surveyId })
  const { total: usedSpace } = await FileManager.fetchCountAndTotalFilesSize({ surveyId })
  const availableSpace = Math.max(0, totalSpace - usedSpace)

  return {
    availableSpace,
    totalSpace,
    usedSpace,
  }
}

export const cleanupAllSurveysFilesProps = async () => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  let count = 0
  for await (const surveyId of surveyIds) {
    const cleanedFiles = await FileManager.cleanupSurveyFilesProps({ surveyId })
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
  // UPDATE
  updateFileProps,
  // DELETE
  deleteFileByUuid,
} = FileManager
