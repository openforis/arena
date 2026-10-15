import * as JobManager from '@server/job/jobManager'
import * as TempFileManager from '@server/modules/file/manager/tempFileManager'

import SurveyCompareJob from './surveyCompareJob'
import SurveyCompareApplyJob from './surveyCompareApplyJob'
import { readKeptJson } from './surveyCompareSource'

export const startSurveyCompareJob = (params: {
  user: any
  surveyId: number
  filePath?: string
  fileId?: string
  totalChunks?: number
  totalFileSize?: number
  sourceFileId?: string
  sourceSurveyId?: number
  manualMatches?: Record<string, string>
}) => JobManager.enqueueJob(new SurveyCompareJob(params))

export const startSurveyCompareApplyJob = (params: {
  user: any
  surveyId: number
  sourceFileId?: string
  sourceSurveyId?: number
  selectedIds: string[]
  manualMatches?: Record<string, string>
}) => JobManager.enqueueJob(new SurveyCompareApplyJob(params))

/**
 * Reads the result of a comparison; it is read only once, so it is deleted afterwards.
 * @param {object} params - The parameters.
 * @param {string} params.resultFileId - Id of the result file kept in the temp storage.
 * @returns {Promise<any>} - The comparison result.
 */
export const readSurveyCompareResult = async ({ resultFileId }: { resultFileId: string }) => {
  const result = await readKeptJson({ fileId: resultFileId })
  await TempFileManager.deletePendingImportFileIfAny({ fileId: resultFileId })
  return result
}
