import * as A from '../../../../core/arena'
import * as DateUtils from '../../../../core/dateUtils'

import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'

import * as SurveyRdbService from '../service/surveyRdbService'

import { requireRecordListViewPermission, requireSurveyRdbRefreshPermission } from '../../auth/authApiMiddleware'

export const init = (app) => {
  app.get('/surveyRdb/recreateRdbs', requireSurveyRdbRefreshPermission, async (req, res, next) => {
    try {
      const { job } = await SurveyRdbService.refreshAllRdbs()

      res.json({ job })
    } catch (error) {
      next(error)
    }
  })

  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/query', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, query: queryParam, offset, limit } = Request.getParams(req)

      const query = A.parse(queryParam)

      const rows = await SurveyRdbService.fetchViewData({ surveyId, cycle, query, offset, limit })

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
        const { surveyId, cycle, query: queryParam } = Request.getParams(req)

        const query = A.parse(queryParam)

        const count = await SurveyRdbService.countTable({ surveyId, cycle, query })

        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )

  app.post('/surveyRdb/:surveyId/:nodeDefUuidTable/export', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, query: queryParam } = Request.getParams(req)

      const query = A.parse(queryParam)

      const outputFileName = `data-export-${DateUtils.nowFormatDefault()}.csv`
      Response.setContentTypeFile(res, outputFileName, null, Response.contentTypes.csv)

      await SurveyRdbService.fetchViewData({ surveyId, cycle, query, streamOutput: res, addCycle: true })
    } catch (error) {
      next(error)
    }
  })
}
