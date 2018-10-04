const {sendOk, sendErr} = require('../serverUtils/response')
const {getRestParam} = require('../serverUtils/request')

const {insertTaxonomy, updateTaxonomyProp} = require('./taxonomyRepository')

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

      await updateTaxonomyProp(surveyId, taxonomyId, body)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}