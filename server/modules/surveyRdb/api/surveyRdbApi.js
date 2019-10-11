const Request = require('../../../utils/request')
const Response = require('../../../utils/response')

const SurveyRdbService = require('../service/surveyRdbService')

const { requireRecordListViewPermission } = require('../../auth/authApiMiddleware')

module.exports.init = app => {

  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/query', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, nodeDefUuidTable, cycle, offset, limit, editMode = false } = Request.getParams(req)

      const nodeDefUuidCols = Request.getJsonParam(req, 'nodeDefUuidCols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort')

      const rows = await SurveyRdbService.queryTable(surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols, offset, limit, filter, sort, editMode)

      res.json(rows)
    } catch (err) {
      next(err)
    }
  })

  app.post('/surveyRdb/:surveyId/:tableName/query/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, tableName } = Request.getParams(req)
      const filter = Request.getJsonParam(req, 'filter', null)

      const count = await SurveyRdbService.countTable(surveyId, cycle, tableName, filter)

      res.json(count)
    } catch (err) {
      next(err)
    }
  })

  app.get('/surveyRdb/:surveyId/:tableName/export', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, tableName } = Request.getParams(req)
      const cols = Request.getJsonParam(req, 'cols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort', '')

      Response.setContentTypeFile(res, 'data.csv', null, Response.contentTypes.csv)

      await SurveyRdbService.exportTableToCSV(surveyId, cycle, tableName, cols, filter, sort, res)

      res.end()
    } catch (err) {
      next(err)
    }
  })

}