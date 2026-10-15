import SystemError, { StatusCodes } from '@core/systemError'
import { SurveyCompareMaxFileSizeMB } from '@core/survey/surveyCompare/surveyCompareTypes'

import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyCompareService from '../service/surveyCompareService'
import * as SurveyFingerprintService from '../service/surveyFingerprintService'

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

const getSourceParams = async (req: any) => {
  const { sourceFileId, sourceSurveyId } = Request.getParams(req)
  if (sourceSurveyId) return { sourceSurveyId: Number(sourceSurveyId) }
  if (sourceFileId) return { sourceFileId }
  checkDeclaredFileSize(req)
  const fileParams = await processChunkedFileForBackgroundMerge({ req })
  await checkUploadedFileSize(fileParams?.filePath)
  return fileParams
}

export const init = (app: any) => {
  // starts the comparison with an uploaded survey file (or with the one uploaded before: sourceFileId)
  // or with another survey on this server (sourceSurveyId)
  app.post(
    '/survey/:surveyId/compare',
    AuthMiddleware.requireSurveyEditPermission,
    AuthMiddleware.requireSurveyCompareSourceViewPermission,
    async (req: any, res: any) => {
      try {
        const user = Request.getUser(req)
        const { surveyId } = Request.getParams(req)
        const sourceParams = await getSourceParams(req)
        if (sourceParams) {
          const manualMatches = Request.getJsonParam(req, 'manualMatches', {})
          const job = SurveyCompareService.startSurveyCompareJob({
            user,
            surveyId: Number(surveyId),
            manualMatches,
            ...sourceParams,
          })
          res.json({ job: JobUtils.jobToJSON(job) })
        } else {
          res.json({ chunkProcessing: true })
        }
      } catch (error) {
        Response.sendErr(res, error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/compare/result',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: any, res: any) => {
      try {
        const { resultFileId } = Request.getParams(req)
        const result = await SurveyCompareService.readSurveyCompareResult({ resultFileId })
        res.json(result)
      } catch (error) {
        Response.sendErr(res, error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/compare/apply',
    AuthMiddleware.requireSurveyEditPermission,
    AuthMiddleware.requireSurveyCompareSourceViewPermission,
    (req: any, res: any) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, sourceFileId, sourceSurveyId } = Request.getParams(req)
        const selectedIds = Request.getJsonParam(req, 'selectedIds', [])
        const manualMatches = Request.getJsonParam(req, 'manualMatches', {})
        const job = SurveyCompareService.startSurveyCompareApplyJob({
          user,
          surveyId: Number(surveyId),
          sourceFileId,
          sourceSurveyId: sourceSurveyId ? Number(sourceSurveyId) : undefined,
          selectedIds,
          manualMatches,
        })
        res.json({ job: JobUtils.jobToJSON(job) })
      } catch (error) {
        Response.sendErr(res, error)
      }
    }
  )

  // fingerprints of the survey definition: they tell whether two surveys have the same definition
  app.get('/survey/:surveyId/fingerprint', AuthMiddleware.requireSurveyViewPermission, async (req: any, res: any) => {
    try {
      const { surveyId, draft } = Request.getParams(req)
      const fingerprint = await SurveyFingerprintService.fetchSurveyFingerprint({ surveyId: Number(surveyId), draft })
      res.json(fingerprint)
    } catch (error) {
      Response.sendErr(res, error)
    }
  })
}
