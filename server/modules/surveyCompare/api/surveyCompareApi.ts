import SystemError, { StatusCodes } from '@core/systemError'
import { SurveyCompareMaxFileSizeMB } from '@core/survey/surveyCompare/surveyCompareTypes'

import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyCompareService from '../service/surveyCompareService'

const maxFileSizeBytes = SurveyCompareMaxFileSizeMB * 1024 * 1024

const fileTooLargeError = () =>
  new SystemError('surveyCompareFileTooLarge', { maxSize: SurveyCompareMaxFileSizeMB }, StatusCodes.BAD_REQUEST)

// chunked uploads declare the total size: reject them before storing any chunk
const checkDeclaredFileSize = (req: any) => {
  const totalFileSize = Request.getNumericParam(req, 'totalFileSize')
  if (totalFileSize !== null && totalFileSize > maxFileSizeBytes) {
    throw fileTooLargeError()
  }
}

const checkUploadedFileSize = async (filePath?: string) => {
  if (filePath && FileUtils.getFileSize(filePath) > maxFileSizeBytes) {
    await FileUtils.deleteFileAsync(filePath)
    throw fileTooLargeError()
  }
}

const getSourceFileParams = async (req: any) => {
  const { sourceFileName } = Request.getParams(req)
  if (sourceFileName) return { sourceFileName }
  checkDeclaredFileSize(req)
  const fileParams = await processChunkedFileForBackgroundMerge({ req })
  await checkUploadedFileSize(fileParams?.filePath)
  return fileParams
}

export const init = (app: any) => {
  // starts the comparison with an uploaded survey file (or with the one uploaded before: sourceFileName)
  app.post('/survey/:surveyId/compare', AuthMiddleware.requireSurveyEditPermission, async (req: any, res: any) => {
    try {
      const user = Request.getUser(req)
      const { surveyId } = Request.getParams(req)
      const fileParams = await getSourceFileParams(req)
      if (fileParams) {
        const job = SurveyCompareService.startSurveyCompareJob({ user, surveyId: Number(surveyId), ...fileParams })
        res.json({ job: JobUtils.jobToJSON(job) })
      } else {
        res.json({ chunkProcessing: true })
      }
    } catch (error) {
      Response.sendErr(res, error)
    }
  })

  app.get(
    '/survey/:surveyId/compare/result',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: any, res: any) => {
      try {
        const { resultFileName } = Request.getParams(req)
        const result = await SurveyCompareService.readSurveyCompareResult({ resultFileName })
        res.json(result)
      } catch (error) {
        Response.sendErr(res, error)
      }
    }
  )

  app.post('/survey/:surveyId/compare/apply', AuthMiddleware.requireSurveyEditPermission, (req: any, res: any) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, sourceFileName } = Request.getParams(req)
      const selectedIds = Request.getJsonParam(req, 'selectedIds', [])
      const job = SurveyCompareService.startSurveyCompareApplyJob({
        user,
        surveyId: Number(surveyId),
        sourceFileName,
        selectedIds,
      })
      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      Response.sendErr(res, error)
    }
  })
}
