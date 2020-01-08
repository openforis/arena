import * as ProcessingStep from '@common/analysis/processingStep'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ProcessingChainService from '../service/processingChainService'

export const init = app => {
  // ====== CREATE - Chain

  app.post(
    '/survey/:surveyId/processing-chain',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey } = Request.getParams(req)
        const user = Request.getUser(req)

        const processingChainUuid = await ProcessingChainService.createChain(user, surveyId, surveyCycleKey)

        res.json(processingChainUuid)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== CREATE - Processing Step

  app.post(
    '/survey/:surveyId/processing-chain/:processingChainUuid/processing-step',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid, processingStepIndex } = Request.getParams(req)
        const user = Request.getUser(req)

        const processingStepUuid = await ProcessingChainService.createProcessingStep(
          user,
          surveyId,
          processingChainUuid,
          processingStepIndex,
        )

        res.json(processingStepUuid)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== CREATE - Processing Step Calculation

  app.post(
    '/survey/:surveyId/processing-step/:processingStepUuid/calculation',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid, index } = Request.getParams(req)
        const user = Request.getUser(req)

        const calculationStep = await ProcessingChainService.createProcessingStepCalculation(
          user,
          surveyId,
          processingStepUuid,
          index,
        )

        res.json(calculationStep)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== READ - Chain

  app.get(
    '/survey/:surveyId/processing-chains/count',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey } = Request.getParams(req)

        const count = await ProcessingChainService.countChainsBySurveyId(surveyId, surveyCycleKey)

        res.json(count)
      } catch (error) {
        next(error)
      }
    },
  )

  app.get(
    '/survey/:surveyId/processing-chains',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey, offset, limit } = Request.getParams(req)

        const list = await ProcessingChainService.fetchChainsBySurveyId(surveyId, surveyCycleKey, offset, limit)

        res.json({ list })
      } catch (error) {
        next(error)
      }
    },
  )

  app.get(
    '/survey/:surveyId/processing-chain/:processingChainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid } = Request.getParams(req)

        const processingChain = await ProcessingChainService.fetchChainByUuid(surveyId, processingChainUuid)

        res.json(processingChain)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== READ - Steps

  app.get(
    '/survey/:surveyId/processing-chain/:processingChainUuid/processing-steps',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid } = Request.getParams(req)

        const processingSteps = await ProcessingChainService.fetchStepsByChainUuid(surveyId, processingChainUuid)

        res.json(processingSteps)
      } catch (error) {
        next(error)
      }
    },
  )

  app.get(
    '/survey/:surveyId/processing-step/:processingStepUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid } = Request.getParams(req)

        const processingStep = await ProcessingChainService.fetchStepByUuid(surveyId, processingStepUuid)
        const processingChainUuid = ProcessingStep.getProcessingChainUuid(processingStep)
        const index = ProcessingStep.getIndex(processingStep)

        const [processingStepPrev, processingStepNext] = await Promise.all([
          ProcessingChainService.fetchStepSummaryByIndex(surveyId, processingChainUuid, index - 1),
          ProcessingChainService.fetchStepSummaryByIndex(surveyId, processingChainUuid, index + 1),
        ])

        res.json({ processingStep, processingStepPrev, processingStepNext })
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== UPDATE - Chain

  app.put(
    '/survey/:surveyId/processing-chain/:processingChainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid, key, value } = Request.getParams(req)
        const user = Request.getUser(req)

        await ProcessingChainService.updateChainProp(user, surveyId, processingChainUuid, key, value)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== UPDATE - Processing Step

  app.put(
    '/survey/:surveyId/processing-step/:processingStepUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid, props } = Request.getParams(req)
        const user = Request.getUser(req)

        await ProcessingChainService.updateStepProps(user, surveyId, processingStepUuid, props)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    },
  )

  app.put(
    '/survey/:surveyId/processing-step/:processingStepUuid/calculation-index',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid, indexFrom, indexTo } = Request.getParams(req)
        const user = Request.getUser(req)

        await ProcessingChainService.updateStepCalculationIndex(user, surveyId, processingStepUuid, indexFrom, indexTo)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    },
  )

  app.put(
    '/survey/:surveyId/processing-step/:processingStepUuid/calculation',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)
        const calculation = Request.getBody(req)
        const user = Request.getUser(req)
        await ProcessingChainService.updateStepCalculation(user, surveyId, calculation)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== DELETE - Chain

  app.delete(
    '/survey/:surveyId/processing-chain/:processingChainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        await ProcessingChainService.deleteChain(user, surveyId, processingChainUuid)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    },
  )

  // ====== DELETE - Step

  app.delete(
    '/survey/:surveyId/processing-step/:processingStepUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        await ProcessingChainService.deleteStep(user, surveyId, processingStepUuid)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    },
  )
}
