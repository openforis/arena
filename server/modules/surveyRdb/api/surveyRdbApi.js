import * as DateUtils from '../../../../core/dateUtils'

import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'

import * as SurveyRdbService from '../service/surveyRdbService'

import { requireRecordListViewPermission } from '../../auth/authApiMiddleware'

const _getParamsQuery = (req) => {
  const { surveyId, nodeDefUuidTable, cycle, offset, limit, editMode = false } = Request.getParams(req)
  const nodeDefUuidCols = Request.getJsonParam(req, 'nodeDefUuidCols', [])
  const filter = Request.getJsonParam(req, 'filter')
  const sort = Request.getJsonParam(req, 'sort')

  return { surveyId, cycle, nodeDefUuidTable, nodeDefUuidCols, offset, limit, filter, sort, editMode }
}

const _getParamsQueryAgg = (req) => {
  const { surveyId, cycle, table, offset, limit } = Request.getParams(req)
  const measures = Request.getJsonParam(req, 'measures', {})
  const dimensions = Request.getJsonParam(req, 'dimensions', [])
  const filter = Request.getJsonParam(req, 'filter')
  const sort = Request.getJsonParam(req, 'sort')

  return { surveyId, cycle, table, measures, dimensions, filter, offset, limit, sort }
}

export const init = (app) => {
  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/query', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const params = _getParamsQuery(req)

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
        const params = _getParamsQuery(req)

        const count = await SurveyRdbService.countTable(params)

        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/export', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const params = { ..._getParamsQuery(req), streamOutput: res }

      const outputFileName = `data-export-${DateUtils.nowFormatDefault()}.csv`
      Response.setContentTypeFile(res, outputFileName, null, Response.contentTypes.csv)

      await SurveyRdbService.fetchViewData(params)
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/surveyRdb/:surveyId/:nodeDefUuidTable/query-agg',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const params = _getParamsQueryAgg(req)

        const rows = await SurveyRdbService.fetchViewDataAgg(params)

        res.json(rows)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/surveyRdb/:surveyId/:nodeDefUuidTable/query-agg/count',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const params = _getParamsQueryAgg(req)

        const count = await SurveyRdbService.countViewDataAgg(params)

        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/surveyRdb/:surveyId/:nodeDefUuidTable/export-agg',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const params = { ..._getParamsQueryAgg(req), streamOutput: res }

        const outputFileName = `data-export-${DateUtils.nowFormatDefault()}.csv`
        Response.setContentTypeFile(res, outputFileName, null, Response.contentTypes.csv)

        await SurveyRdbService.fetchViewDataAgg(params)
      } catch (error) {
        next(error)
      }
    }
  )
}
