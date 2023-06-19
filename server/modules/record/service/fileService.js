import * as FileManager from '../manager/fileManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as Log from '@server/log/log'

const logger = Log.getLogger('FileService')

// UPDATE

export const moveFilesContentToNewStorageIfNeeded = async () => {
  const storageType = FileManager.getFileContentStorageType()
  if (storageType !== FileManager.fileContentStorageTypes.db) {
    logger.debug(`Moving survey files to new storage (${storageType}) if necessary`)
    const surveyIds = await SurveyManager.fetchAllSurveyIds()
    await Promise.all(surveyIds.map((surveyId) => FileManager.moveFilesContentToNewStorageIfNeeded({ surveyId })))
    logger.debug(`Survey files move complete`)
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
