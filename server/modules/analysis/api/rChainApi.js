import * as ApiRoutes from '@common/apiRoutes'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'

import * as JobUtils from '@server/job/jobUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== READ - Chain entity data
  app.get(
    ApiRoutes.rChain.entityData({
      surveyId: ':surveyId',
      cycle: ':cycle',
      chainUuid: ':chainUuid',
      entityUuid: ':entityDefUuid',
    }),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { token, surveyId, cycle, chainUuid, entityDefUuid } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        Response.setContentTypeFile({ res, fileName: 'data.csv', contentType: Response.contentTypes.csv })

        await AnalysisService.fetchNodeData({
          surveyId,
          cycle,
          chainUuid,
          nodeDefUuid: entityDefUuid,
          draft: false,
          res,
        })
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Chain multiple attribute data
  app.get(
    ApiRoutes.rChain.multipleAttributeData({
      surveyId: ':surveyId',
      cycle: ':cycle',
      chainUuid: ':chainUuid',
      attributeDefUuid: ':attributeDefUuid',
    }),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { token, surveyId, cycle, chainUuid, attributeDefUuid } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        Response.setContentTypeFile({ res, fileName: 'data.csv', contentType: Response.contentTypes.csv })

        await AnalysisService.fetchNodeData({
          surveyId,
          cycle,
          chainUuid,
          nodeDefUuid: attributeDefUuid,
          draft: false,
          res,
        })
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Category items
  app.get(
    ApiRoutes.rChain.categoryItemsCsv({
      surveyId: ':surveyId',
      chainUuid: ':chainUuid',
      categoryUuid: ':categoryUuid',
    }),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid, categoryUuid, language, draft, token } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        await CategoryService.exportCategory({
          surveyId,
          categoryUuid,
          language,
          draft,
          includeUuid: true,
          includeSingleCode: true,
          includeCodeJoint: true,
          includeLevelPosition: true,
          includeReportingDataCumulativeArea: true,
          res,
        })
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Taxonomy items
  app.get(
    ApiRoutes.rChain.taxonomyItemsData({
      surveyId: ':surveyId',
      chainUuid: ':chainUuid',
      taxonomyUuid: ':taxonomyUuid',
    }),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid, taxonomyUuid, token } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        const taxonomy = await TaxonomyService.fetchTaxonomyByUuid(surveyId, taxonomyUuid)
        const extraPropKeys = Taxonomy.getExtraPropKeys(taxonomy)

        const taxaWithVernacularNames = await TaxonomyService.fetchTaxaWithVernacularNames({ surveyId, taxonomyUuid })

        const itemsSummary = taxaWithVernacularNames.map((taxonWithVernacularNames) => ({
          uuid: Taxon.getUuid(taxonWithVernacularNames),
          code: Taxon.getCode(taxonWithVernacularNames),
          family: Taxon.getFamily(taxonWithVernacularNames),
          scientific_name: Taxon.getScientificName(taxonWithVernacularNames),
          ...extraPropKeys.reduce(
            (extraPropsAcc, extraPropKey) => ({
              ...extraPropsAcc,
              [extraPropKey]: Taxon.getExtraProp(extraPropKey)(taxonWithVernacularNames),
            }),
            {}
          ),
        }))
        res.json(itemsSummary)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== UPDATE - calculated entity data
  app.put(
    ApiRoutes.rChain.entityData({
      surveyId: ':surveyId',
      cycle: ':cycle',
      chainUuid: ':chainUuid',
      entityUuid: ':entityDefUuid',
    }),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const filePath = Request.getFilePath(req)
        const { surveyId, cycle, chainUuid, entityDefUuid, token } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        const user = Request.getUser(req)

        const job = AnalysisService.startPersistResultsJob({
          user,
          surveyId,
          cycle,
          entityDefUuid,
          chainUuid,
          filePath,
        })

        res.json(JobUtils.jobToJSON(job))
      } catch (e) {
        next(e)
      }
    }
  )

  // ====== UPDATE - Chain
  app.put(
    ApiRoutes.rChain.chainStatusExec({ surveyId: ':surveyId', chainUuid: ':chainUuid' }),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid, token } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        const { statusExec } = Request.getBody(req)
        const user = Request.getUser(req)
        await AnalysisService.updateChainStatusExec({ user, surveyId, chainUuid, statusExec })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )

  app.put(
    ApiRoutes.rChain.chainUserScripts({ surveyId: ':surveyId', chainUuid: ':chainUuid' }),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid, token } = Request.getParams(req)

        AnalysisService.checkRStudioToken({ token, chainUuid })

        const filePath = Request.getFilePath(req)
        const user = Request.getUser(req)

        await AnalysisService.persistUserScripts({ user, surveyId, chainUuid, filePath })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )
}
