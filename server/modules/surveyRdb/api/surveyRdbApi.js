const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const SurveyRdbService = require('../service/surveyRdbService')

const { requireRecordListViewPermission } = require('../../auth/authApiMiddleware')

module.exports.init = app => {

  app.post('/surveyRdb/:surveyId/:tableName/query', requireRecordListViewPermission, async (req, res) => {
    try {
      const { surveyId, nodeDefUuidTable, tableName, offset, limit, editMode = false } = Request.getParams(req)

      const cols = Request.getJsonParam(req, 'cols', [])
      const nodeDefUuidCols = Request.getJsonParam(req, 'nodeDefUuidCols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort')

      const rows = await SurveyRdbService.queryTable(surveyId, nodeDefUuidTable, tableName, nodeDefUuidCols, cols, offset, limit, filter, sort, editMode)

      res.json(rows)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.post('/surveyRdb/:surveyId/:tableName/query/count', requireRecordListViewPermission, async (req, res) => {
    try {
      const { surveyId, tableName } = Request.getParams(req)
      const filter = Request.getJsonParam(req, 'filter', null)

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
      const cols = Request.getJsonParam(req, 'cols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort', '')

      Response.setContentTypeFile(res, 'data.csv', null, Response.contentTypes.csv)

      await SurveyRdbService.exportTableToCSV(surveyId, tableName, cols, filter, sort, res)

      res.end()
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}