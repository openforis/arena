import * as Taxonomy from '../../../../core/survey/taxonomy'
import * as Taxon from '../../../../core/survey/taxon'
import * as ApiRoutes from '../../../../common/apiRoutes'

import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as CategoryService from '../../category/service/categoryService'
import * as TaxonomyService from '../../taxonomy/service/taxonomyService'
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
        const { surveyId, cycle, chainUuid, entityDefUuid } = Request.getParams(req)

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
        const { surveyId, cycle, chainUuid, attributeDefUuid } = Request.getParams(req)

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
    ApiRoutes.rChain.categoryItemsData(':surveyId', ':categoryUuid'),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, language, draft } = Request.getParams(req)

        const itemsSummary = await CategoryService.fetchCategoryItemsSummary({
          surveyId,
          categoryUuid,
          language,
          draft,
        })
        res.json(itemsSummary)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Taxonomy items
  app.get(
    ApiRoutes.rChain.taxonomyItemsData(':surveyId', ':taxonomyUuid'),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid } = Request.getParams(req)

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
        const { surveyId, cycle, chainUuid, entityDefUuid } = Request.getParams(req)
        await AnalysisService.persistResults({ surveyId, cycle, entityDefUuid, chainUuid, filePath })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )

  // ====== UPDATE - Chain
  app.put(
    ApiRoutes.rChain.chainStatusExec(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
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
    ApiRoutes.rChain.chainUserScripts(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
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
