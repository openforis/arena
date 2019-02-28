const Response = require('../serverUtils/response')
const { getRestParam, getBoolParam } = require('../serverUtils/request')
const { toUuidIndexedObj } = require('../../common/survey/surveyUtils')

const JobManager = require('../job/jobManager')
const { jobToJSON } = require('../job/jobUtils')
const TaxonomyManager = require('./taxonomyManager')
const TaxonomyImportJob = require('./taxonomyImportJob')

const AuthMiddleware = require('../authGroup/authMiddleware')

const sendTaxonomies = async (res, surveyId, draft, validate) => {
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(surveyId, draft, validate)
  res.json({ taxonomies: toUuidIndexedObj(taxonomies) })
}

module.exports.init = app => {

  // ====== CREATE
  app.post('/survey/:surveyId/taxonomies', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const { body, user } = req

      const taxonomy = await TaxonomyManager.createTaxonomy(user, surveyId, body)

      res.json({ taxonomy })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ====== READ

  app.get(`/survey/:surveyId/taxonomies`, AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      await sendTaxonomies(res, surveyId, draft, validate)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      const taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, validate)

      res.json({ taxonomy })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa/count', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const draft = getBoolParam(req, 'draft')

      const count = await TaxonomyManager.countTaxaByTaxonomyUuid(surveyId, taxonomyUuid, draft)

      res.json({ count })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const filterProp = getRestParam(req, 'filterProp')
      const filterValue = getRestParam(req, 'filterValue')

      const draft = getBoolParam(req, 'draft')
      const limit = getRestParam(req, 'limit', 20)
      const offset = getRestParam(req, 'offset', 0)
      const includeUnlUnk = getRestParam(req, 'includeUnlUnk', false)

      let taxa
      if (filterProp) {
        if (filterProp === 'vernacularName') {
          taxa = await TaxonomyManager.fetchTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft, includeUnlUnk)
        } else {
          taxa = await TaxonomyManager.fetchTaxaByPropLike(surveyId, taxonomyUuid, filterProp, filterValue, draft, includeUnlUnk)
        }
      } else {
        taxa = await TaxonomyManager.fetchAllTaxa(surveyId, taxonomyUuid, draft, limit, offset)
      }

      res.json({ taxa })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxon', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonUuid = getRestParam(req, 'taxonUuid')
      const vernacularNameUuid = getRestParam(req, 'vernacularNameUuid')
      const draft = getBoolParam(req, 'draft')

      const taxon = vernacularNameUuid
        ? await TaxonomyManager.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, draft)
        : await TaxonomyManager.fetchTaxonByUuid(surveyId, taxonUuid, draft)

      res.json({ taxon })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/export', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const draft = getBoolParam(req, 'draft')

      Response.setContentTypeFile(res, `taxonomy_${taxonomyUuid}.csv`, null, Response.contentTypes.csv)

      await TaxonomyManager.exportTaxa(surveyId, taxonomyUuid, res, draft)

      res.end()
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ====== UPDATE

  app.put('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const { body, user } = req
      const { key, value } = body

      await TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, key, value)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/taxonomies/:taxonomyUuid/upload', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const user = req.user
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')

      const file = req.files.file

      const job = new TaxonomyImportJob({
        user,
        surveyId,
        taxonomyUuid,
        csvString: file.data.toString('utf8')
      })

      JobManager.executeJobThread(job)

      res.json({ job: jobToJSON(job) })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ====== DELETE

  app.delete('/survey/:surveyId/taxonomies/:taxonomyUuid', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const { user } = req

      await TaxonomyManager.deleteTaxonomy(user, surveyId, taxonomyUuid)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}