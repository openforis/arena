import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/chain'
import * as ChainValidator from '@common/analysis/chainValidator'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== CREATE - Chain

  app.post('/survey/:surveyId/chain/', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { cycle, surveyId } = Request.getParams(req)
      const user = Request.getUser(req)

      const chain = await AnalysisService.create({ user, surveyId, cycle })

      res.json(chain)
    } catch (error) {
      next(error)
    }
  })

  // ====== READ - Chains

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

  app.get(
    '/survey/:surveyId/processing-chains/count',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey: cycle } = Request.getParams(req)

        const count = await AnalysisService.countChains({ surveyId, cycle })

        res.json({ count })
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Chain

  app.get(
    '/survey/:surveyId/chain/:chainUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)

        const chain = await AnalysisService.fetchChain({ surveyId, chainUuid })

        res.json(chain)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/chain/:chainUuid/summary',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid, cycle, lang } = Request.getParams(req)

        const chainSummary = await AnalysisService.generateChainSummary({ surveyId, chainUuid, cycle, lang })

        Response.setContentTypeFile({ res, fileName: 'chain_summary.json' })
        res.json(chainSummary)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== UPDATE - Chain

  app.put('/survey/:surveyId/chain/', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      const user = Request.getUser(req)

      const { chain } = Request.getBody(req)

      const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
      const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
      const validation = await ChainValidator.validateChain({ chain, defaultLang, survey })

      const chainWithValdidation = Chain.assocValidation(validation)(chain)

      await AnalysisService.update({ user, surveyId, chain: chainWithValdidation })

      res.json(chainWithValdidation)
    } catch (error) {
      next(error)
    }
  })

  // ====== DELETE - Chain

  app.get('/survey/:surveyId/chains-clean', AuthMiddleware.requireRecordAnalysisPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)

      await AnalysisService.cleanChains({ user, surveyId })

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete(
    '/survey/:surveyId/chain/:chainUuid',
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

  // === GENERATE R SCRIPTS
  app.get(
    '/survey/:surveyId/chain/:chainUuid/script',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, surveyCycleKey, chainUuid } = Request.getParams(req)
        const serverUrl = Request.getServerUrl(req)
        await AnalysisService.generateScript({ surveyId, cycle: surveyCycleKey, chainUuid, serverUrl })
        const token = AnalysisService.generateRStudioToken({ chainUuid })
        res.json({ token, serverUrl })
      } catch (error) {
        next(error)
      }
    }
  )

  // === Download R SCRIPTS
  app.get('/survey/:surveyId/chain/:chainUuid/script/public', async (req, res, next) => {
    try {
      const { surveyId, surveyCycleKey, chainUuid, token } = Request.getParams(req)
      if (!AnalysisService.checkRStudioToken({ token, chainUuid })) Response.sendErr()
      const serverUrl = Request.getServerUrl(req)
      const rChain = await AnalysisService.generateScript({ surveyId, cycle: surveyCycleKey, chainUuid, serverUrl })
      const name = `${chainUuid}.zip`
      Response.sendDirAsZip({ res, dir: rChain._dir, name })
    } catch (error) {
      next(error)
    }
  })
}
