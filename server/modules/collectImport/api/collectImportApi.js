import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as JobUtils from '@server/job/jobUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'

import * as SurveyService from '@server/modules/survey/service/surveyService'

import * as CollectImportService from '../service/collectImportService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'

export const init = (app) => {
  // CREATE

  app.post('/survey/collect-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const file = Request.getFile(req)
      const newSurvey = Request.getJsonParam(req, 'survey')
      const validation = await SurveyService.validateSurveyClone({ newSurvey })

      if (Validation.isValid(validation)) {
        const job = CollectImportService.startCollectImportJob({ user, filePath: file.tempFilePath, newSurvey })
        res.json({ job: JobUtils.jobToJSON(job) })
      } else {
        res.json({ validation })
      }
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
        const { surveyId, excludeResolved = false, offset, limit } = Request.getParams(req)

        const list = await CollectImportService.fetchReportItems({ surveyId, excludeResolved, offset, limit })

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
        const { surveyId, draft = true } = Request.getParams(req)

        const survey = await SurveyService.fetchSurveyById({ surveyId, draft })
        const surveyInfo = Survey.getSurveyInfo(survey)
        const surveyName = Survey.getName(surveyInfo)
        const messageLangCode = Survey.getDefaultLanguage(surveyInfo)

        const reportItemsStream = await CollectImportService.fetchReportItemsStream({ surveyId, messageLangCode })

        const headers = [
          'id',
          'node_def_uuid',
          'node_def_name',
          'type',
          'expression',
          'apply_if',
          'message',
          'resolved',
        ]

        const fileName = `${surveyName}_collect-report_${DateUtils.nowFormatDefault()}.csv`
        Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

        await db.stream(reportItemsStream, (stream) => stream.pipe(CSVWriter.transformToStream(res, headers)))
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
        const { surveyId, excludeResolved } = Request.getParams(req)

        const count = await CollectImportService.countReportItems({ surveyId, excludeResolved })

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

        res.json({ item })
      } catch (error) {
        next(error)
      }
    }
  )
}
