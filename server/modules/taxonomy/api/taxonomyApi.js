const Request = require('../../../utils/request')
const Response = require('../../../utils/response')
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
  app.post('/survey/:surveyId/taxonomies', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const { body, user } = req

      const taxonomy = await TaxonomyService.createTaxonomy(user, surveyId, body)

      res.json({ taxonomy })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ====== READ

  app.get(`/survey/:surveyId/taxonomies`, AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const draft = Request.getBoolParam(req, 'draft')
      const validate = Request.getBoolParam(req, 'validate')

      await sendTaxonomies(res, surveyId, draft, validate)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')
      const draft = Request.getBoolParam(req, 'draft')
      const validate = Request.getBoolParam(req, 'validate')

      const taxonomy = await TaxonomyService.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, validate)

      res.json({ taxonomy })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa/count', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')
      const draft = Request.getBoolParam(req, 'draft')

      const count = await TaxonomyService.countTaxaByTaxonomyUuid(surveyId, taxonomyUuid, draft)

      res.json({ count })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')
      const filterProp = Request.getRestParam(req, 'filterProp')
      const filterValue = Request.getRestParam(req, 'filterValue')

      const draft = Request.getBoolParam(req, 'draft')
      const limit = Request.getRestParam(req, 'limit', 20)
      const offset = Request.getRestParam(req, 'offset', 0)
      const includeUnlUnk = Request.getRestParam(req, 'includeUnlUnk', false)

      let taxa
      if (filterProp) {
        if (filterProp === 'vernacularName') {
          taxa = await TaxonomyService.fetchTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft, includeUnlUnk)
        } else {
          taxa = await TaxonomyService.fetchTaxaByPropLike(surveyId, taxonomyUuid, filterProp, filterValue, draft, includeUnlUnk)
        }
      } else {
        taxa = await TaxonomyService.fetchAllTaxa(surveyId, taxonomyUuid, draft, limit, offset)
      }

      res.json({ taxa })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxon', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonUuid = Request.getRestParam(req, 'taxonUuid')
      const vernacularNameUuid = Request.getRestParam(req, 'vernacularNameUuid')
      const draft = Request.getBoolParam(req, 'draft')

      const taxon = vernacularNameUuid
        ? await TaxonomyService.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, draft)
        : await TaxonomyService.fetchTaxonByUuid(surveyId, taxonUuid, draft)

      res.json({ taxon })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/export', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')
      const draft = Request.getBoolParam(req, 'draft')

      Response.setContentTypeFile(res, `taxonomy_${taxonomyUuid}.csv`, null, Response.contentTypes.csv)

      await TaxonomyService.exportTaxa(surveyId, taxonomyUuid, res, draft)

      res.end()
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ====== UPDATE

  app.put('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')
      const { body, user } = req
      const { key, value } = body

      await TaxonomyService.updateTaxonomyProp(user, surveyId, taxonomyUuid, key, value)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/taxonomies/:taxonomyUuid/upload', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const user = req.user
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')

      const file = Request.getFile(req)

      const job = TaxonomyService.importTaxonomy(user, surveyId, taxonomyUuid, file.tempFilePath)

      res.json({ job: jobToJSON(job) })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ====== DELETE

  app.delete('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const taxonomyUuid = Request.getRestParam(req, 'taxonomyUuid')
      const { user } = req

      await TaxonomyService.deleteTaxonomy(user, surveyId, taxonomyUuid)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}