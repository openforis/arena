import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as SurveyRdbService from '../service/surveyRdbService'

import { requireRecordListViewPermission } from '../../auth/authApiMiddleware'

export const init = (app) => {
  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/query', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, nodeDefUuidTable, cycle, offset, limit, editMode = false } = Request.getParams(req)
      const nodeDefUuidCols = Request.getJsonParam(req, 'nodeDefUuidCols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort')

      const params = { surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols, offset, limit, filter, sort, editMode }
      const rows = await SurveyRdbService.fetchViewData(params)

      res.json(rows)
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/surveyRdb/:surveyId/:nodeDefUuidTable/query/count',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, nodeDefUuidTable } = Request.getParams(req)
        const filter = Request.getJsonParam(req, 'filter', null)

        const count = await SurveyRdbService.countTable(surveyId, cycle, nodeDefUuidTable, filter)

        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get('/surveyRdb/:surveyId/:nodeDefUuidTable/export', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, nodeDefUuidTable } = Request.getParams(req)
      const nodeDefUuidCols = Request.getJsonParam(req, 'nodeDefUuidCols', [])
      const filter = Request.getJsonParam(req, 'filter')
      const sort = Request.getJsonParam(req, 'sort', '')

      Response.setContentTypeFile(res, 'data.csv', null, Response.contentTypes.csv)
      const params = { surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols, filter, sort, streamOutput: res }

      await SurveyRdbService.fetchViewData(params)
    } catch (error) {
      next(error)
    }
  })
}
