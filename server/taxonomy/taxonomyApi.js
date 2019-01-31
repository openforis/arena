const { sendErr } = require('../serverUtils/response')
const { getRestParam, getBoolParam, getJsonParam } = require('../serverUtils/request')
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
      sendErr(res, err)
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
      sendErr(res, err)
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
      sendErr(res, err)
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
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/taxa', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const draft = getBoolParam(req, 'draft')
      const limit = getRestParam(req, 'limit', 25)
      const offset = getRestParam(req, 'offset', 0)
      const includeUnlUnk = getRestParam(req, 'includeUnlUnk', false)
      const filter = getJsonParam(req, 'filter')
      const sort = { field: 'scientificName', asc: true }

      const params = {
        filter, sort, limit, offset, includeUnlUnk
      }

      const taxa = await TaxonomyManager.fetchTaxaByPropLike(surveyId, taxonomyUuid, params, draft)

      res.json({ taxa })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyUuid/export', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyUuid = getRestParam(req, 'taxonomyUuid')
      const draft = getBoolParam(req, 'draft')

      const fileName = `taxonomy_${taxonomyUuid}.csv`
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`)
      res.set('Content-Type', 'text/csv')

      await TaxonomyManager.exportTaxa(surveyId, taxonomyUuid, res, draft)

      res.end()
    } catch (err) {
      sendErr(res, err)
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
      sendErr(res, err)
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
      sendErr(res, err)
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
      sendErr(res, err)
    }
  })

}