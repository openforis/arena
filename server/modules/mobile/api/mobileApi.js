import * as Request from '../../../utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as JobUtils from '@server/job/jobUtils'
import * as ArenaMobileImportService from '../service/arenaMobileImportService'
import { ArenaMobileDataImport } from '../service/arenaMobileDataImport'

const fetchSurvey = async ({ surveyId, cycle }) =>
  SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, cycle, advanced: true })

export const init = (app) => {
  // ====== READ - all survey data
  app.get('/mobile/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      const survey = await fetchSurvey({ surveyId, cycle })

      res.json({ survey })
    } catch (e) {
      next(e)
    }
  })

  // ====== UPDATE - records and files of the survey
  app.post('/mobile/survey/:surveyId', AuthMiddleware.requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, conflictResolutionStrategy = ArenaMobileDataImport.conflictResolutionStrategies.skipExisting } =
        Request.getParams(req)

      const filePath = Request.getFilePath(req)

      const job = ArenaMobileImportService.startArenaMobileImportJob({
        user,
        filePath,
        surveyId,
        conflictResolutionStrategy,
      })

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (e) {
      next(e)
    }
  })
}
