import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as Request from '@server/utils/request'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyCompareService from '../service/surveyCompareService'

export const init = (app: any) => {
  // starts the comparison with an uploaded survey file (or with the one uploaded before: sourceFileName)
  app.post(
    '/survey/:surveyId/compare',
    AuthMiddleware.requireSurveyViewPermission,
    async (req: any, res: any, next: any) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, sourceFileName } = Request.getParams(req)
        const fileParams = sourceFileName ? { sourceFileName } : await processChunkedFileForBackgroundMerge({ req })
        if (fileParams) {
          const job = SurveyCompareService.startSurveyCompareJob({ user, surveyId: Number(surveyId), ...fileParams })
          res.json({ job: JobUtils.jobToJSON(job) })
        } else {
          res.json({ chunkProcessing: true })
        }
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/compare/result',
    AuthMiddleware.requireSurveyViewPermission,
    async (req: any, res: any, next: any) => {
      try {
        const { resultFileName } = Request.getParams(req)
        const result = await SurveyCompareService.readSurveyCompareResult({ resultFileName })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/compare/apply',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: any, res: any, next: any) => {
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
        next(error)
      }
    }
  )
}
