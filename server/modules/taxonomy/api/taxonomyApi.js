const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const Taxon = require('../../../../common/survey/taxon')
const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')

const { jobToJSON } = require('../../../job/jobUtils')
const TaxonomyService = require('../service/taxonomyService')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const sendTaxonomies = async (res, surveyId, draft, validate) => {
  const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId(surveyId, draft, validate)
  res.json({ taxonomies: toUuidIndexedObj(taxonomies) })
}

module.exports.init = app => {

  // ====== CREATE
  app.post('/survey/:surveyId/taxonomies', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const user = Request.getUser(req)
      const taxonomyReq = Request.getBody(req)

      const taxonomy = await TaxonomyService.insertTaxonomy(user, surveyId, taxonomyReq)

      res.json({ taxonomy })
    } catch (err) {
      next(err)
    }
  })

  // ====== READ

  app.get(`/survey/:surveyId/taxonomies`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)

      await sendTaxonomies(res, surveyId, draft, validate)
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, taxonomyUuid, draft, validate } = Request.getParams(req)

      const taxonomy = await TaxonomyService.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, validate)

      res.json({ taxonomy })
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa/count', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, taxonomyUuid, draft } = Request.getParams(req)

      const count = await TaxonomyService.countTaxaByTaxonomyUuid(surveyId, taxonomyUuid, draft)

      res.json({ count })
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const {
        surveyId,
        taxonomyUuid,
        filterProp,
        filterValue,
        draft,
        limit = 20,
        offset = 0,
        includeUnlUnk = false
      } = Request.getParams(req)

      let taxa
      if (filterProp) {
        if (filterProp === Taxon.keys.vernacularName) {
          taxa = await TaxonomyService.findTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft, includeUnlUnk)
        } else if (filterProp === Taxon.propKeys.code) {
          taxa = await TaxonomyService.findTaxaByCode(surveyId, taxonomyUuid, filterValue, draft, includeUnlUnk)
        } else {
          taxa = await TaxonomyService.findTaxaByScientificName(surveyId, taxonomyUuid, filterValue, draft, includeUnlUnk)
        }
      } else {
        taxa = await TaxonomyService.fetchTaxaWithVernacularNames(surveyId, taxonomyUuid, draft, limit, offset)
      }

      res.json({ taxa })
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxon', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, taxonUuid, vernacularNameUuid, draft } = Request.getParams(req)

      const taxon = vernacularNameUuid
        ? await TaxonomyService.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, draft)
        : await TaxonomyService.fetchTaxonByUuid(surveyId, taxonUuid, draft)

      res.json({ taxon })
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/export', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, taxonomyUuid, draft } = Request.getParams(req)

      Response.setContentTypeFile(res, `taxonomy_${taxonomyUuid}.csv`, null, Response.contentTypes.csv)

      await TaxonomyService.exportTaxa(surveyId, taxonomyUuid, res, draft)

      res.end()
    } catch (err) {
      next(err)
    }
  })

  // ====== UPDATE

  app.put('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, taxonomyUuid, key, value } = Request.getParams(req)
      const user = Request.getUser(req)

      await TaxonomyService.updateTaxonomyProp(user, surveyId, taxonomyUuid, key, value)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      next(err)
    }
  })

  app.post('/survey/:surveyId/taxonomies/:taxonomyUuid/upload', AuthMiddleware.requireSurveyEditPermission, (req, res) => {
    const { surveyId, taxonomyUuid } = Request.getParams(req)
    const user = Request.getUser(req)
    const file = Request.getFile(req)

    const job = TaxonomyService.importTaxonomy(user, surveyId, taxonomyUuid, file.tempFilePath)

    res.json({ job: jobToJSON(job) })
  })

  // ====== DELETE

  app.delete('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, taxonomyUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await TaxonomyService.deleteTaxonomy(user, surveyId, taxonomyUuid)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      next(err)
    }
  })

}