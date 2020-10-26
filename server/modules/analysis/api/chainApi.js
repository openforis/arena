import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== READ - Chains

  app.get(
    '/survey/:surveyId/processing-chains/count',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey: cycle } = Request.getParams(req)

        const count = await AnalysisService.countChains({ surveyId, cycle })

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
        const { surveyId, surveyCycleKey: cycle, offset, limit } = Request.getParams(req)

        const list = await AnalysisService.fetchChains({ surveyId, cycle, offset, limit })

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

        const chain = await AnalysisService.fetchChain({ surveyId, chainUuid, includeStepsAndCalculations: true })

        res.json(chain)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/processing-chain/:chainUuid/attribute-uuids-other-chains',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)

        const params = { surveyId, chainUuidExclude: chainUuid }
        const attributeUuids = await AnalysisService.fetchCalculationAttributeUuids(params)

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
        await AnalysisService.persistAll({ user, surveyId, chain, step, calculation })

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Chain

  app.delete(
    '/survey/:surveyId/processing-chain/:chainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        await AnalysisService.deleteChain({ user, surveyId, chainUuid })

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Step

  app.delete(
    '/survey/:surveyId/processing-step/:stepUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, stepUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const nodeDefUnusedDeletedUuids = await AnalysisService.deleteStep({ user, surveyId, stepUuid })

        res.json(nodeDefUnusedDeletedUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE - Calculation

  app.delete(
    '/survey/:surveyId/processing-step/:stepUuid/calculation/:calculationUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, stepUuid, calculationUuid } = Request.getParams(req)
        const user = Request.getUser(req)

        const params = { user, surveyId, stepUuid, calculationUuid }
        const nodeDefUnusedDeletedUuids = await AnalysisService.deleteCalculation(params)

        res.json(nodeDefUnusedDeletedUuids)
      } catch (error) {
        next(error)
      }
    }
  )

  // === GENERATE R SCRIPTS
  app.get(
    '/survey/:surveyId/processing-chain/:chainUuid/script',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey, chainUuid } = Request.getParams(req)
        const serverUrl = Request.getServerUrl(req)
        await AnalysisService.generateScript({ surveyId, cycle: surveyCycleKey, chainUuid, serverUrl })
        const token = AnalysisService.saveRStudioToken({ chainUuid })
        res.json({ token, serverUrl })
      } catch (error) {
        next(error)
      }
    }
  )

  // === Download R SCRIPTS
  app.get('/survey/:surveyId/processing-chain/:chainUuid/script/public', async (req, res, next) => {
    try {
      const { surveyId, surveyCycleKey, chainUuid, token } = Request.getParams(req)
      if (!AnalysisService.checkRStudioToken({ token, chainUuid })) Response.sendErr()
      const serverUrl = Request.getServerUrl(req)
      const rChain = await AnalysisService.generateScript({ surveyId, cycle: surveyCycleKey, chainUuid, serverUrl })
      const name = `${chainUuid}.zip`
      Response.sendZipFile(res, rChain._dir, name)
    } catch (error) {
      next(error)
    }
  })
}
