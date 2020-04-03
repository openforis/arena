import * as CategoryItem from '@core/survey/categoryItem'
import * as ApiRoutes from '@common/apiRoutes'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as RChainService from '@server/modules/analysis/service/rChainService'

export const init = (app) => {
  // ====== READ - Step Data
  app.get(
    ApiRoutes.rChain.getStepEntityDataRead(':surveyId', ':processingStepUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, processingStepUuid } = Request.getParams(req)

        const data = await RChainService.fetchStepData(surveyId, cycle, processingStepUuid)

        res.json(data)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Category items
  app.get(
    ApiRoutes.rChain.getCategoryItemsDataRead(':surveyId', ':categoryUuid'),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, language, draft } = Request.getParams(req)

        const items = await CategoryService.fetchItemsByParentUuid(surveyId, categoryUuid, null, draft)

        const itemsSummary = items.map((item) => ({
          uuid: CategoryItem.getUuid(item),
          code: CategoryItem.getCode(item),
          label: CategoryItem.getLabel(language)(item),
        }))
        res.json(itemsSummary)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Chain node results
  app.delete(
    ApiRoutes.rChain.getChainNodeResultsReset(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, chainUuid } = Request.getParams(req)

        await RChainService.deleteNodeResults(surveyId, cycle, chainUuid)

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )
}
