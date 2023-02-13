import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'

import * as ObjectUtils from '../../../../core/objectUtils'
import * as Survey from '../../../../core/survey/survey'
import * as Taxon from '../../../../core/survey/taxon'
import * as Taxonomy from '../../../../core/survey/taxonomy'

import { jobToJSON } from '../../../job/jobUtils'
import * as SurveyService from '../../survey/service/surveyService'
import * as TaxonomyService from '../service/taxonomyService'

import * as AuthMiddleware from '../../auth/authApiMiddleware'

const sendTaxonomies = async (res, surveyId, draft, validate) => {
  const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId, draft, validate })

  res.json({ taxonomies: ObjectUtils.toUuidIndexedObj(taxonomies) })
}

const _generateExportFileName = ({ survey, fileType, taxonomy = null, extension = 'csv' }) => {
  const surveyName = Survey.getName(survey)
  const taxonomyName = taxonomy ? Taxonomy.getName(taxonomy) || 'taxonomy' : ''
  return `${surveyName}_${fileType}${taxonomy ? `_${taxonomyName}` : ''}.${extension}`
}

export const init = (app) => {
  // ====== CREATE
  app.post('/survey/:surveyId/taxonomies', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)
      const taxonomyReq = Request.getBody(req)

      const taxonomy = await TaxonomyService.insertTaxonomy({ user, surveyId, taxonomy: taxonomyReq })

      res.json({ taxonomy })
    } catch (error) {
      next(error)
    }
  })

  // ====== READ

  app.get('/survey/:surveyId/taxonomies', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit, draft, validate, search } = Request.getParams(req)
      const list = await TaxonomyService.fetchTaxonomiesBySurveyId({
        surveyId,
        draft,
        validate,

        offset,
        limit,
        search,
      })
      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/taxonomies/count', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const count = await TaxonomyService.countTaxonomiesBySurveyId({ surveyId })
      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.get(
    '/survey/:surveyId/taxonomies/:taxonomyUuid',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid, draft, validate } = Request.getParams(req)

        const taxonomy = await TaxonomyService.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, validate)

        res.json({ taxonomy })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/taxonomies/:taxonomyUuid/taxa/count',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid, draft } = Request.getParams(req)

        const count = await TaxonomyService.countTaxaByTaxonomyUuid(surveyId, taxonomyUuid, draft)

        res.json({ count })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/taxonomies/:taxonomyUuid/taxa',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const {
          surveyId,
          taxonomyUuid,
          filterProp,
          filterValue,
          draft,
          limit = 20,
          offset = 0,
          includeUnlUnk = false,
        } = Request.getParams(req)

        let list
        if (filterProp) {
          if (filterProp === Taxon.keys.vernacularName) {
            list = await TaxonomyService.findTaxaByVernacularName(
              surveyId,
              taxonomyUuid,
              filterValue,
              draft,
              includeUnlUnk
            )
          } else if (filterProp === Taxon.propKeys.code) {
            list = await TaxonomyService.findTaxaByCode(surveyId, taxonomyUuid, filterValue, draft, includeUnlUnk)
          } else {
            list = await TaxonomyService.findTaxaByScientificName(
              surveyId,
              taxonomyUuid,
              filterValue,
              draft,
              includeUnlUnk
            )
          }
        } else {
          list = await TaxonomyService.fetchTaxaWithVernacularNames({ surveyId, taxonomyUuid, draft, limit, offset })
        }

        res.json({ list })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/taxonomies/:taxonomyUuid/taxon',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonUuid, vernacularNameUuid, draft } = Request.getParams(req)

        const taxon = vernacularNameUuid
          ? await TaxonomyService.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, draft)
          : await TaxonomyService.fetchTaxonByUuid(surveyId, taxonUuid, draft)

        res.json({ taxon })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/taxonomies/:taxonomyUuid/export',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid, draft } = Request.getParams(req)

        const [survey, taxonomy] = await Promise.all([
          SurveyService.fetchSurveyById({ surveyId, draft }),
          TaxonomyService.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft),
        ])
        const fileName = _generateExportFileName({ survey, taxonomy, fileType: 'Taxonomy' })
        Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

        await TaxonomyService.exportTaxa(surveyId, taxonomyUuid, res, draft)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== UPDATE

  app.put(
    '/survey/:surveyId/taxonomies/:taxonomyUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid, key, value } = Request.getParams(req)
        const user = Request.getUser(req)

        await TaxonomyService.updateTaxonomyProp(user, surveyId, taxonomyUuid, key, value)

        await sendTaxonomies(res, surveyId, true, true)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/taxonomies/:taxonomyUuid/upload',
    AuthMiddleware.requireSurveyEditPermission,
    (req, res) => {
      const { surveyId, taxonomyUuid } = Request.getParams(req)
      const user = Request.getUser(req)
      const file = Request.getFile(req)

      const job = TaxonomyService.importTaxonomy(user, surveyId, taxonomyUuid, file.tempFilePath)

      res.json({ job: jobToJSON(job) })
    }
  )

  app.put(
    '/survey/:surveyId/taxonomies/:taxonomyUuid/extradef',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid, propName, deleted } = Request.getParams(req)
        const extraPropDef = Request.getJsonParam(req, 'extraPropDef')
        const user = Request.getUser(req)

        const taxonomy = await TaxonomyService.updateTaxonomyExtraPropDef({
          user,
          surveyId,
          taxonomyUuid,
          propName,
          extraPropDef,
          deleted,
        })

        res.json({ taxonomy })
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== DELETE

  app.delete(
    '/survey/:surveyId/taxonomies/:taxonomyUuid',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, taxonomyUuid, onlyIfEmpty = false } = Request.getParams(req)
        const user = Request.getUser(req)

        await TaxonomyService.deleteTaxonomy({ user, surveyId, taxonomyUuid, onlyIfEmpty })

        await sendTaxonomies(res, surveyId, true, true)
      } catch (error) {
        next(error)
      }
    }
  )
}
