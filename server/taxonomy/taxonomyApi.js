const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam, getBoolParam, getJsonParam} = require('../serverUtils/request')
const {toUUIDIndexedObj} = require('../../common/survey/surveyUtils')

const {
  countTaxaByTaxonomyId,
  fetchTaxaByProp,
  createTaxonomy,
  updateTaxonomyProp,
  deleteTaxonomy
} = require('./taxonomyManager')
const {fetchTaxonomiesBySurveyId, importTaxa, exportTaxa} = require('./taxonomyManager')

module.exports.init = app => {

  // ====== CREATE
  app.post('/survey/:surveyId/taxonomies', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const {body} = req

      const taxonomy = await createTaxonomy(surveyId, body)

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

      const taxonomies = await fetchTaxonomiesBySurveyId(surveyId, draft, draft)

      res.json({taxonomies})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId/taxonomies/:taxonomyId/taxa/count', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const draft = getBoolParam(req, 'draft')

      const count = await countTaxaByTaxonomyId(surveyId, taxonomyId, draft)

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
      const limit = getRestParam(req, 'limit')
      const offset = getRestParam(req, 'offset', 0)
      const filter = getJsonParam(req, 'filter')
      const sort = {field: 'scientificName', asc: true}

      const taxa = await fetchTaxaByProp(surveyId, taxonomyId, filter, sort, limit, offset, draft)

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

      await exportTaxa(surveyId, taxonomyId, res, draft)

      res.end()
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ====== UPDATE

  app.put('/survey/:surveyId/taxonomies/:taxonomyId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const {body} = req
      const {key, value} = body

      await updateTaxonomyProp(surveyId, taxonomyId, key, value)
      const taxonomies = await fetchTaxonomiesBySurveyId(surveyId, true)

      res.json({taxonomies: toUUIDIndexedObj(taxonomies)})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/taxonomies/:taxonomyId/upload', async (req, res) => {
    try {
      const user = req.user
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')

      const file = req.files.file
      const job = await importTaxa(user.id, surveyId, taxonomyId, file.data)

      res.json({job})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ====== DELETE

  app.delete('/survey/:surveyId/taxonomies/:taxonomyId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')

      await deleteTaxonomy(surveyId, taxonomyId)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}