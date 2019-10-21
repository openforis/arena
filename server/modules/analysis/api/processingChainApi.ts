const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const ProcessingChainService = require('../service/processingChainService')

module.exports.init = app => {

  //====== CREATE

  app.post('/survey/:surveyId/processing-chain', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, surveyCycleKey } = Request.getParams(req)
      const user = Request.getUser(req)

      const processingChainUuid = await ProcessingChainService.createChain(user, surveyId, surveyCycleKey)

      res.json({ processingChainUuid })
    } catch (err) {
      next(err)
    }
  })

  //====== READ

  app.get('/survey/:surveyId/processing-chains/count', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, surveyCycleKey } = Request.getParams(req)

      const count = await ProcessingChainService.countChainsBySurveyId(surveyId, surveyCycleKey)
      res.json(count)

    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/processing-chains', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, surveyCycleKey, offset, limit } = Request.getParams(req)

      const list = await ProcessingChainService.fetchChainsBySurveyId(surveyId, surveyCycleKey, offset, limit)

      res.json({ list })
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/processing-chain/:processingChainUuid', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, processingChainUuid } = Request.getParams(req)

      const processingChain = await ProcessingChainService.fetchChainByUuid(surveyId, processingChainUuid)

      res.json({ processingChain })
    } catch (err) {
      next(err)
    }
  })

  //====== UPDATE

  app.put('/survey/:surveyId/processing-chain/:processingChainUuid', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, processingChainUuid, key, value } = Request.getParams(req)
      const user = Request.getUser(req)

      const processingChain = await ProcessingChainService.updateChainProp(user, surveyId, processingChainUuid, key, value)

      res.json({ processingChain })
    } catch (err) {
      next(err)
    }
  })

  //====== DELETE

  app.delete('/survey/:surveyId/processing-chain/:processingChainUuid', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId, processingChainUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await ProcessingChainService.deleteChain(user, surveyId, processingChainUuid)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

}