const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {fetchTaxonomiesBySurveyId, insertTaxonomy, updateTaxonomyProp, deleteTaxonomy} = require('./taxonomyRepository')
const {validateTaxonomy} = require('./taxonomyValidator')
const {importTaxa} = require('./taxonomyManager')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey/:surveyId/taxonomies', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const {body} = req

      const taxonomy = await insertTaxonomy(surveyId, body)

      res.json({taxonomy})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/taxonomies/:taxonomyId', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')
      const {body} = req

      const taxonomy = await updateTaxonomyProp(surveyId, taxonomyId, body)
      const taxonomies = await fetchTaxonomiesBySurveyId(surveyId, true)
      const validation = await validateTaxonomy(taxonomies, taxonomy)

      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.post('/survey/:surveyId/taxonomies/:taxonomyId/upload', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const taxonomyId = getRestParam(req, 'taxonomyId')

      const file = req.files.file
      importTaxa(surveyId, taxonomyId, file.data)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

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