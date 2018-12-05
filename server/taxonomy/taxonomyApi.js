const {sendErr} = require('../serverUtils/response')
const {getRestParam, getBoolParam, getJsonParam} = require('../serverUtils/request')
const {toUuidIndexedObj} = require('../../common/survey/surveyUtils')

const JobManager = require('../job/jobManager')
const {jobToJSON} = require('../job/jobUtils')
const TaxonomyManager = require('./taxonomyManager')
const TaxonomyImportJob = require('./taxonomyImportJob')

const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')

const sendTaxonomies = async (res, surveyId, draft, validate) => {
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(surveyId, draft, validate)
  res.json({taxonomies: toUuidIndexedObj(taxonomies)})
}

module.exports.init = app => {

  // ====== CREATE
  app.post('/survey/:surveyId/taxonomies', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const {body} = req

      const taxonomy = await TaxonomyManager.createTaxonomy(surveyId, body)

      res.json({taxonomy})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ====== READ

  app.get(`/survey/:surveyId/taxonomies`, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      await sendTaxonomies(res, surveyId, draft, validate)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      const taxonomy = await TaxonomyManager.fetchTaxonomyById(surveyId, taxonomyId, draft, validate)

      res.json({taxonomy})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyId/taxa/count', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const draft = getBoolParam(req, 'draft')

      const count = await TaxonomyManager.countTaxaByTaxonomyId(surveyId, taxonomyId, draft)

      res.json({count})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyId/taxa', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const draft = getBoolParam(req, 'draft')
      const limit = getRestParam(req, 'limit', 25)
      const offset = getRestParam(req, 'offset', 0)
      const filter = getJsonParam(req, 'filter')
      const sort = {field: 'scientificName', asc: true}

      const params = {
        filter, sort, limit, offset
      }

      const taxa = await TaxonomyManager.fetchTaxaByPropLike(surveyId, taxonomyId, params, draft)

      res.json({taxa})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyId/export', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const draft = getBoolParam(req, 'draft')

      const fileName = `taxonomy_${taxonomyId}.csv`
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`)
      res.set('Content-Type', 'text/csv')

      await TaxonomyManager.exportTaxa(surveyId, taxonomyId, res, draft)

      res.end()
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ====== UPDATE

  app.put('/survey/:surveyId/taxonomies/:taxonomyId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const {body} = req
      const {key, value} = body

      await TaxonomyManager.updateTaxonomyProp(surveyId, taxonomyId, key, value)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/taxonomies/:taxonomyId/upload', requireSurveyEditPermission, async (req, res) => {
    try {
      const user = req.user
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')

      const file = req.files.file

      const job = new TaxonomyImportJob({
        userId: user.id,
        surveyId,
        taxonomyId,
        csvString: file.data.toString('utf8')
      })

      JobManager.executeJobThread(job)

      res.json({job: jobToJSON(job)})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ====== DELETE

  app.delete('/survey/:surveyId/taxonomies/:taxonomyId', requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')

      await TaxonomyManager.deleteTaxonomy(surveyId, taxonomyId)

      await sendTaxonomies(res, surveyId, true, true)
    } catch (err) {
      sendErr(res, err)
    }
  })

}