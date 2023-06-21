import * as FileManager from '../manager/fileManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Log from '@server/log/log'

const logger = Log.getLogger('FileService')

// UPDATE

export const checkFilesStorage = async () => {
  const storageType = FileManager.getFileContentStorageType()

  logger.debug(`Checking if files storage ${storageType} is accessible`)

  if (!(await FileManager.checkCanAccessFilesStorage())) return false

  logger.debug(`Files storage ${storageType} is accessible!`)

  if (storageType === FileManager.fileContentStorageTypes.db) {
    return
  }
  logger.debug(`Moving survey files to new storage (${storageType}) if necessary`)
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  const surveyFilesMoveResult = await Promise.all(
    surveyIds.map((surveyId) => FileManager.moveFilesToNewStorageIfNecessary({ surveyId }))
  )
  if (surveyFilesMoveResult.some((result) => result)) {
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
