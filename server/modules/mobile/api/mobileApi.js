import * as Request from '../../../utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as JobUtils from '@server/job/jobUtils'
import * as ArenaMobileImportService from '../service/arenaMobileImportService'
import { ArenaMobileDataImport } from '../service/arenaMobileDataImport'

export const init = (app) => {
  // ====== READ - all survey day
  app.get('/mobile/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
        surveyId,
        cycle,
        draft: false,
        backup: true,
      })

      res.json({ survey })
    } catch (e) {
      next(e)
    }
  })

  // ====== UPDATE - records and files of the survey
  app.post('/mobile/survey/:surveyId', AuthMiddleware.requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const {
        surveyId,
        conflictResolutionStrategy = ArenaMobileDataImport.conflictResolutionStrategies.skipDuplicates,
      } = Request.getParams(req)

      const filePath = Request.getFilePath(req)

      const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId })

      const job = ArenaMobileImportService.startArenaMobileImportJob({
        user,
        filePath,
        survey,
        conflictResolutionStrategy,
      })

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (e) {
      next(e)
    }
  })
}
