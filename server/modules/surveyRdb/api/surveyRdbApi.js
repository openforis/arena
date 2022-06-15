import * as A from '../../../../core/arena'
import * as DateUtils from '../../../../core/dateUtils'

import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'
import * as FileUtils from '../../../utils/file/fileUtils'

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

  app.get('/surveyRdb/:surveyId/view_data_counts', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, entityDefUuids } = Request.getParams(req)

      const countsByUuid = await SurveyRdbService.countTables({ surveyId, cycle, entityDefUuids })

      res.json(countsByUuid)
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/surveyRdb/:surveyId/:nodeDefUuidTable/export/start',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, query: queryParam } = Request.getParams(req)

        const query = A.parse(queryParam)

        const tempFileName = await SurveyRdbService.exportViewDataToTempFile({ surveyId, cycle, query, addCycle: true })

        res.json({ tempFileName })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/surveyRdb/:surveyId/:nodeDefUuidTable/export/download',
    requireRecordListViewPermission,
    async (req, res, next) => {
      try {
        const { tempFileName } = Request.getParams(req)

        Response.sendFile({
          res,
          path: FileUtils.tempFilePath(tempFileName),
          name: `data-export-${DateUtils.nowFormatDefault()}.csv`,
          contentType: Response.contentTypes.csv,
        })
      } catch (error) {
        next(error)
      }
    }
  )
}
