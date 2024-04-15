import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'
import * as FileUtils from '../../../utils/file/fileUtils'

import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as SurveyRdbService from '../service/surveyRdbService'

import { requireRecordListViewPermission, requireSurveyRdbRefreshPermission } from '../../auth/authApiMiddleware'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

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
      const { surveyId, cycle, query, offset, limit } = Request.getParams(req)
      const user = Request.getUser(req)

      const rows = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query, offset, limit })

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
        const { surveyId, cycle, query } = Request.getParams(req)
        const user = Request.getUser(req)

        const count = await SurveyRdbService.countTable({ user, surveyId, cycle, query })

        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )

  app.get('/surveyRdb/:surveyId/view_data_rows_counts', requireRecordListViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, entityDefUuids } = Request.getParams(req)

      const countsByUuid = await SurveyRdbService.fetchTableRowsCountByEntityDefUuid({
        surveyId,
        cycle,
        entityDefUuids,
      })

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
        const { surveyId, cycle, query } = Request.getParams(req)
        const user = Request.getUser(req)

        const tempFileName = await SurveyRdbService.exportViewDataToTempFile({
          user,
          surveyId,
          cycle,
          query,
          addCycle: true,
        })

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
        const { surveyId, cycle, tempFileName } = Request.getParams(req)

        const survey = await SurveyService.fetchSurveyById({ surveyId })
        const outputFileName = ExportFileNameGenerator.generate({ survey, cycle, fileType: 'ExlorerTable' })

        Response.sendFile({
          res,
          path: FileUtils.tempFilePath(tempFileName),
          name: outputFileName,
          contentType: Response.contentTypes.csv,
        })
      } catch (error) {
        next(error)
      }
    }
  )
}
