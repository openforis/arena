import * as Request from '@server/utils/request'

import * as JobUtils from '@server/job/jobUtils'

import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as Response from '@server/utils/response'

import * as CollectImportService from '../service/collectImportService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'

import * as DateUtils from '@core/dateUtils'

import * as Survey from '@core/survey/survey'

export const init = (app) => {
  // CREATE

  app.post('/survey/collect-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const file = Request.getFile(req)

      const job = CollectImportService.startCollectImportJob(user, file.tempFilePath)

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })

  // READ

  app.get(
    '/survey/:surveyId/collect-import/report',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, offset, limit } = Request.getParams(req)

        const list = await CollectImportService.fetchReportItems(surveyId, offset, limit)

        res.json({ list })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/collect-import/report/export',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, offset, limit, draft = true } = Request.getParams(req)

        const reportItemsStream = await CollectImportService.fetchReportItemsStream(surveyId, offset, limit)

        const survey = await SurveyService.fetchSurveyById(surveyId, draft)
        const surveyName = Survey.getName(Survey.getSurveyInfo(survey))

        const fileName = `${surveyName}_collect-report_${DateUtils.nowFormatDefault()}.csv`
        Response.setContentTypeFile(res, fileName, null, Response.contentTypes.csv)

        const headers = ['node_def_uuid', 'id', 'type', 'expression', 'resolved']

        await db.stream(reportItemsStream, (stream) => {
          stream.pipe(CSVWriter.transformToStream(res, headers))
        })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/collect-import/report/count',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)

        const count = await CollectImportService.countReportItems(surveyId)

        res.json({ count })
      } catch (error) {
        next(error)
      }
    }
  )

  // UPDATE

  app.post(
    '/survey/:surveyId/collect-import/report/:itemId/resolve',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, itemId, resolved } = Request.getParams(req)
        const user = Request.getUser(req)

        const item = await CollectImportService.updateReportItem(user, surveyId, itemId, {}, resolved)

        return res.json({ item })
      } catch (error) {
        next(error)
      }
    }
  )
}
