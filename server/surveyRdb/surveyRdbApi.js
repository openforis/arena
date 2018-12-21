const R = require('ramda')

const {sendErr} = require('../serverUtils/response')
const Request = require('../serverUtils/request')

//const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')
const SurveyRdbManager = require('./surveyRdbManager')

module.exports.init = app => {

  app.get('/surveyRdb/:surveyId/:tableName/query', async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')

      const offset = Request.getRestParam(req, 'offset')
      const limit = Request.getRestParam(req, 'limit')
      const cols = Request.getJsonParam(req, 'cols', [])

      const rows = await SurveyRdbManager.queryTable(surveyId, tableName, cols, offset, limit)

      res.json(rows)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/surveyRdb/:surveyId/:tableName/query/count', async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')

      const count = await SurveyRdbManager.countTable(surveyId, tableName)

      res.json(count)
    } catch (err) {
      sendErr(res, err)
    }
  })
}