const Request = require('@server/utils/request')
const Response = require('@server/utils/response')

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

  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/query/count', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, nodeDefUuidTable } = Request.getParams(req)
      const filter = Request.getJsonParam(req, 'filter', null)

      const count = await SurveyRdbService.countTable(surveyId, cycle, nodeDefUuidTable, filter)

      res.json(count)
    } catch (err) {
      next(err)
    }
  })

  app.get('/surveyRdb/:surveyId/:nodeDefUuidTable/export', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, nodeDefUuidTable } = Request.getParams(req)
      const nodeDefUuidCols = Request.getJsonParam(req, 'nodeDefUuidCols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort', '')

      Response.setContentTypeFile(res, 'data.csv', null, Response.contentTypes.csv)
      await SurveyRdbService.queryTable(surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols, 0, null, filter, sort, false, res)
    } catch (err) {
      next(err)
    }
  })

}