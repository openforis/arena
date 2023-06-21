import * as FileManager from '../manager/fileManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Log from '@server/log/log'

const logger = Log.getLogger('FileService')

// UPDATE

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
  const allSurveysFilesMoveResult = await Promise.all(
    surveyIds.map((surveyId) => FileManager.moveFilesToNewStorageIfNecessary({ surveyId }))
  )
  if (allSurveysFilesMoveResult.some((surveyFilesMoved) => surveyFilesMoved)) {
    logger.debug(`Survey files moved successfully`)
  } else {
    logger.debug('Survey files move not necessary')
  }
}

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileByUuid,
  fetchFileByNodeUuid,
  fetchFileSummariesBySurveyId,
} = FileManager
