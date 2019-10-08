const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const ProcessingChainService = require('../service/processingChainService')

module.exports.init = app => {
  app.get('/survey/:surveyId/processing-chains/count', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      const count = await ProcessingChainService.countChainsBySurveyId(surveyId, cycle)
      res.json(count)

    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/processing-chains', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, offset, limit } = Request.getParams(req)

      const list = await ProcessingChainService.fetchChainsBySurveyId(surveyId, cycle, offset, limit)

      res.json({ list })
    } catch (err) {
      next(err)
    }
  })
}