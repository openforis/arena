import { Promises } from '@openforis/arena-core'

import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileManager from '../manager/fileManager'

const logger = Log.getLogger('FileService')

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
  let surveysFilesMoved = false
  await Promises.each(surveyIds, async (surveyId) => {
    surveysFilesMoved = surveysFilesMoved || (await FileManager.moveFilesToNewStorageIfNecessary({ surveyId }))
  })
  if (surveysFilesMoved) {
    logger.debug(`Survey files moved successfully`)
  } else {
    logger.debug('Survey files move not necessary')
  }
}

export const {
  // CREATE
  insertFile,
  // READ
  fetchFileContentAsStream,
  fetchFileSummaryByUuid,
  fetchFileSummariesBySurveyId,
} = FileManager
