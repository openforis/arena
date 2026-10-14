import * as JobManager from '@server/job/jobManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import SurveyCompareJob from './surveyCompareJob'
import SurveyCompareApplyJob from './surveyCompareApplyJob'

export const startSurveyCompareJob = (params: {
  user: any
  surveyId: number
  filePath?: string
  fileId?: string
  totalChunks?: number
  totalFileSize?: number
  sourceFileName?: string
}) => JobManager.enqueueJob(new SurveyCompareJob(params))

export const startSurveyCompareApplyJob = (params: {
  user: any
  surveyId: number
  sourceFileName: string
  selectedIds: string[]
}) => JobManager.enqueueJob(new SurveyCompareApplyJob(params))

export const readSurveyCompareResult = async ({ resultFileName }: { resultFileName: string }) => {
  FileUtils.checkIsValidTempFileName(resultFileName)
  return JSON.parse(await FileUtils.readFile(FileUtils.tempFilePath(resultFileName)))
}
