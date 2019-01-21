const R = require('ramda')

const {sendErr} = require('../serverUtils/response')
const Request = require('../serverUtils/request')

//const {requireSurveyEditPermission} = require('../authGroup/authMiddleware')
const SurveyRdbManager = require('./surveyRdbManager')

const {
  requireRecordListViewPermission,
} = require('../authGroup/authMiddleware')

module.exports.init = app => {

  app.get('/surveyRdb/:surveyId/:tableName/query', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')

      const cols = Request.getJsonParam(req, 'cols', [])
      const offset = Request.getRestParam(req, 'offset')
      const limit = Request.getRestParam(req, 'limit')
      const filter = Request.getRestParam(req, 'filter', '')

      const rows = await SurveyRdbManager.queryTable(surveyId, tableName, cols, offset, limit, filter)

      res.json(rows)
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/surveyRdb/:surveyId/:tableName/query/count', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')
      const filter = Request.getRestParam(req, 'filter', '')

      const count = await SurveyRdbManager.countTable(surveyId, tableName, filter)

      res.json(count)
    } catch (err) {
      sendErr(res, err)
    }
  })
}