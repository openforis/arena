import { uuidv4 } from '@core/uuid'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as TempFileManager from '@server/modules/file/manager/tempFileManager'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as FileUtils from '@server/utils/file/fileUtils'
import FileZip from '@server/utils/file/fileZip'
import { db } from '@server/db/db'

import { SurveyCompareSourceSurvey, fetchSurveyFromDb, readSurveyFromFile } from './surveyCompareSurveysReader'

/**
 * Reference to the survey compared with the current one: an uploaded survey file (kept in the shared temp storage)
 * or another survey on this server.
 */
export interface SurveyCompareSourceRef {
  sourceFileId?: string
  sourceSurveyId?: number
}

export interface SurveyCompareSource extends SurveyCompareSourceSurvey {
  readSurveyFileContent: (fileUuid: string) => Promise<Buffer | null>
}

// with S3 storage the kept file is downloaded into a local copy for every use
const isLocalCopy = (): boolean =>
  TempFileManager.getFileContentStorageType() === TempFileManager.fileContentStorageTypes.s3Bucket

/**
 * Moves a local file into the shared temp storage, so it can be used by later requests on any server instance.
 * @param {object} params - The parameters.
 * @param {string} params.filePath - Path of the local file (moved).
 * @returns {Promise<string>} - The id of the kept file.
 */
export const keepFile = async ({ filePath }: { filePath: string }): Promise<string> => {
  const fileId = uuidv4()
  await TempFileManager.keepFileForLaterUse({ fileId, filePath })
  return fileId
}

/**
 * Runs a function with the local path of a file kept with keepFile; the local copy (if any) is deleted afterwards.
 * @param {object} params - The parameters.
 * @param {string} params.fileId - The id of the kept file.
 * @param {Function} fn - Function receiving the local file path.
 * @returns {Promise<any>} - The result of the function.
 */
export const withKeptFilePath = async <T>(
  { fileId }: { fileId: string },
  fn: (filePath: string) => Promise<T>
): Promise<T> => {
  const filePath = await TempFileManager.getKeptFilePath({ fileId })
  try {
    return await fn(filePath)
  } finally {
    if (isLocalCopy()) {
      await FileUtils.deleteFileAsync(filePath).catch(() => null)
    }
  }
}

/**
 * Keeps an object as JSON in the shared temp storage.
 * @param {any} data - The object to keep.
 * @returns {Promise<string>} - The id of the kept file.
 */
export const keepJson = async (data: any): Promise<string> => {
  const filePath = FileUtils.tempFilePath(FileUtils.newTempFileName())
  await FileUtils.writeFile(filePath, JSON.stringify(data))
  return keepFile({ filePath })
}

/**
 * Reads an object kept with keepJson.
 * @param {object} params - The parameters.
 * @param {string} params.fileId - The id of the kept file.
 * @returns {Promise<any>} - The kept object.
 */
export const readKeptJson = async ({ fileId }: { fileId: string }): Promise<any> =>
  withKeptFilePath({ fileId }, async (filePath) => JSON.parse(await FileUtils.readFile(filePath)))

const readSurveyFileFromZip = async ({ filePath, fileUuid }): Promise<Buffer | null> => {
  const zipFile = new FileZip(filePath)
  await zipFile.init()
  try {
    return await ArenaSurveyFileZip.getSurveyFile(zipFile, fileUuid)
  } finally {
    zipFile.close()
  }
}

/**
 * Reads the source survey of a comparison and runs a function with it.
 * @param {SurveyCompareSourceRef} sourceRef - Reference to the source survey.
 * @param {Function} fn - Function receiving the source survey.
 * @param {any} [client] - Database client.
 * @returns {Promise<any>} - The result of the function.
 */
export const withSource = async <T>(
  sourceRef: SurveyCompareSourceRef,
  fn: (source: SurveyCompareSource) => Promise<T>,
  client: any = db
): Promise<T> => {
  const { sourceFileId, sourceSurveyId } = sourceRef
  if (sourceSurveyId) {
    const source = await fetchSurveyFromDb({ surveyId: sourceSurveyId }, client)
    return fn({
      ...source,
      readSurveyFileContent: (fileUuid) =>
        SurveyFileManager.fetchFileContentAsBuffer(
          { surveyId: sourceSurveyId, fileSummary: { uuid: fileUuid } },
          client
        ),
    })
  }
  if (!sourceFileId) {
    throw new Error('Survey compare: source not specified')
  }
  return withKeptFilePath({ fileId: sourceFileId }, async (filePath) => {
    const source = await readSurveyFromFile({ filePath })
    return fn({ ...source, readSurveyFileContent: (fileUuid) => readSurveyFileFromZip({ filePath, fileUuid }) })
  })
}
