import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ProcessingChainService from '../service/processingChainService'
import * as RChainService from '../service/rChainService'

export const init = (app) => {
  // ====== READ - Chains

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
    }
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
    }
  )

  // ====== READ - Chain
  app.get(
    '/survey/:surveyId/processing-chain/:chainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)

        const processingChain = await ProcessingChainService.fetchChainByUuid({ surveyId, chainUuid })

        res.json(processingChain)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/processing-chain/:processingChainUuid/calculation-attribute-uuids',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid } = Request.getParams(req)

        const attributeUuids = await ProcessingChainService.fetchCalculationAttributeUuidsByChainUuid(
          surveyId,
          processingChainUuid
        )

        res.json(attributeUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/processing-chain/:processingChainUuid/attribute-uuids-other-chains',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid } = Request.getParams(req)

        const attributeUuidsOtherChains = await ProcessingChainService.fetchCalculationAttributeUuidsByChainUuidExcluded(
          surveyId,
          processingChainUuid
        )

        res.json(attributeUuidsOtherChains)
      } catch (error) {
        next(error)
      }
    }
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
    }
  )

  // ====== READ - Calculations

  app.get(
    '/survey/:surveyId/processing-step/:processingStepUuid/calculations',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid } = Request.getParams(req)

        const calculations = await ProcessingChainService.fetchCalculationsByStepUuid(surveyId, processingStepUuid)

        res.json(calculations)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/processing-step/:processingStepUuid/calculation-attribute-uuids',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid } = Request.getParams(req)

        const attributeUuids = await ProcessingChainService.fetchCalculationAttributeUuidsByStepUuid(
          surveyId,
          processingStepUuid
        )

        res.json(attributeUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== UPDATE - Chain

  app.put(
    '/survey/:surveyId/processing-chain/',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)

        const user = Request.getUser(req)

        const { chain, step, calculation } = Request.getBody(req)
        await ProcessingChainService.updateChain(user, surveyId, chain, step, calculation)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Chain

  app.delete(
    '/survey/:surveyId/processing-chain/:processingChainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingChainUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const nodeDefUnusedDeletedUuids = await ProcessingChainService.deleteChain(user, surveyId, processingChainUuid)

        res.json(nodeDefUnusedDeletedUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Processing Step

  app.delete(
    '/survey/:surveyId/processing-step/:processingStepUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const nodeDefUnusedDeletedUuids = await ProcessingChainService.deleteStep(user, surveyId, processingStepUuid)

        res.json(nodeDefUnusedDeletedUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Processing Step Calculation

  app.delete(
    '/survey/:surveyId/processing-step/:processingStepUuid/calculation/:calculationUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, processingStepUuid, calculationUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const nodeDefUnusedDeletedUuids = await ProcessingChainService.deleteCalculation(
          user,
          surveyId,
          processingStepUuid,
          calculationUuid
        )

        res.json(nodeDefUnusedDeletedUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  // === GENERATE R SCRIPTS
  app.get(
    '/survey/:surveyId/processing-chain/:processingChainUuid/script',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey, processingChainUuid } = Request.getParams(req)
        const serverUrl = Request.getServerUrl(req)

        await RChainService.generateScript(surveyId, surveyCycleKey, processingChainUuid, serverUrl)

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    }
  )
}
