import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as RChainResultService from '../service/rChainResultService'
import * as RChainResultRepository from '../repository/rChainResultRepository'

export const init = (app) => {
  // Get OLAP view data
  app.get(
    '/survey/:surveyId/rChain/:chainUuid/results/olap',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
        const { entityDefUuid, dimensions, measures, filters, fromDate, toDate } = Request.getParams(req)

        const olapData = await RChainResultService.createOlapView({
          surveyId: Number(surveyId),
          chainUuid,
          entityDefUuid,
          dimensions: dimensions ? dimensions.split(',') : [],
          measures: measures ? measures.split(',') : [],
          filters: filters ? JSON.parse(filters) : {},
          fromDate,
          toDate,
          tx: Request.getTransaction(req),
        })

        res.json({ data: olapData })
      } catch (error) {
        next(error)
      }
    }
  )

  // Get list of available results
  app.get(
    '/survey/:surveyId/rChain/:chainUuid/results',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
        const { limit, offset } = Request.getParams(req)

        const results = await RChainResultService.fetchResults({
          surveyId: Number(surveyId),
          chainUuid,
          limit: limit ? Number(limit) : null,
          offset: offset ? Number(offset) : 0,
          tx: Request.getTransaction(req),
        })

        res.json({ data: results })
      } catch (error) {
        next(error)
      }
    }
  )

  // Get CSV data for a specific result
  app.get(
    '/survey/:surveyId/rChain/result/:resultId',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { resultId } = Request.getParams(req)
        const { filterOptions } = Request.getParams(req)

        // Get result metadata
        const result = await RChainResultRepository.fetchResultById({
          id: Number(resultId),
          tx: Request.getTransaction(req),
        })

        if (!result) {
          return Response.notFound({ message: `Result with id ${resultId} not found` })(res)
        }

        // Read CSV data
        const data = await RChainResultService.readResultData({
          filePath: result.filePath,
          filterOptions: filterOptions ? JSON.parse(filterOptions) : {},
        })

        res.json({ data })
      } catch (error) {
        next(error)
      }
    }
  )

  // Delete a result
  app.delete(
    '/survey/:surveyId/rChain/result/:resultId',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { resultId } = Request.getParams(req)

        await RChainResultService.deleteResult({
          id: Number(resultId),
          tx: Request.getTransaction(req),
        })

        res.json({ data: { deleted: true } })
      } catch (error) {
        next(error)
      }
    }
  )
}
