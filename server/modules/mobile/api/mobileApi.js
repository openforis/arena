import { ConflictResolutionStrategy } from '@common/dataImport'

import * as Request from '../../../utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as JobUtils from '@server/job/jobUtils'
import * as Log from '@server/log/log'
import * as ArenaMobileImportService from '../service/arenaMobileImportService'

const Logger = Log.getLogger('Mobile API')

const fetchSurvey = async ({ surveyId, cycle }) =>
  SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, cycle, advanced: true })

export const init = (app) => {
  // ====== READ - all survey data
  app.get('/mobile/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      Logger.info('fetching survey data')

      const { surveyId, cycle } = Request.getParams(req)

      const totalCategoryItems = await CategoryService.countItemsBySurveyId({ surveyId })
      Logger.info('total category items', totalCategoryItems)

      const totalTaxa = await TaxonomyService.countTaxaBySurveyId({ surveyId })
      Logger.info('total taxa', totalTaxa)

      Logger.info('constrained memory', process.constrainedMemory())
      Logger.info('memory usage before', process.memoryUsage())

      const survey = await fetchSurvey({ surveyId, cycle })

      Logger.info('memory usage after', process.memoryUsage())

      res.json({ survey })
    } catch (e) {
      next(e)
    }
  })

  // ====== UPDATE - records and files of the survey
  app.post('/mobile/survey/:surveyId', AuthMiddleware.requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, conflictResolutionStrategy = ConflictResolutionStrategy.skipExisting } = Request.getParams(req)

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
