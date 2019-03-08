const Request = require('../../../serverUtils/request')
const Response = require('../../../serverUtils/response')

const SurveyRdbService = require('../service/surveyRdbService')

const {
  requireRecordListViewPermission,
} = require('../../../authGroup/authMiddleware')

module.exports.init = app => {

  app.get('/surveyRdb/:surveyId/:tableName/query', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')

      const cols = Request.getJsonParam(req, 'cols', [])
      const offset = Request.getRestParam(req, 'offset')
      const limit = Request.getRestParam(req, 'limit')
      const filter = Request.getRestParam(req, 'filter', '')

      const rows = await SurveyRdbService.queryTable(surveyId, tableName, cols, offset, limit, filter)

      res.json(rows)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/surveyRdb/:surveyId/:tableName/query/count', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')
      const filter = Request.getRestParam(req, 'filter', '')

      const count = await SurveyRdbService.countTable(surveyId, tableName, filter)

      res.json(count)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/surveyRdb/:surveyId/:tableName/export', requireRecordListViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRequiredParam(req, 'surveyId')
      const tableName = Request.getRequiredParam(req, 'tableName')
      const filter = Request.getRestParam(req, 'filter', '')
      const cols = Request.getJsonParam(req, 'cols', [])

      Response.setContentTypeFile(res, 'data.csv', null, Response.contentTypes.csv)

      await SurveyRdbService.exportTableToCSV(surveyId, tableName, cols, filter, res)

      res.end()
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}