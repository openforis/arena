import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { FileFormats } from '@core/fileFormats'

import * as DbUtils from '@server/db/dbUtils'
import * as JobUtils from '@server/job/jobUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

import * as SurveyService from '@server/modules/survey/service/surveyService'

import * as CollectImportService from '../service/collectImportService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'

export const init = (app) => {
  // CREATE

  app.post('/survey/collect-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const file = Request.getFile(req)
      const newSurveyParam = Request.getJsonParam(req, 'survey')

      const { options, ...newSurvey } = newSurveyParam

      const validation = await SurveyService.validateSurveyImportFromCollect({ newSurvey })

      if (Validation.isValid(validation)) {
        const job = CollectImportService.startCollectImportJob({
          user,
          filePath: file.tempFilePath,
          newSurvey,
          options,
        })
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
        const { surveyId, draft = true, fileFormat = FileFormats.csv } = Request.getParams(req)

        const survey = await SurveyService.fetchSurveyById({ surveyId, draft })
        const surveyInfo = Survey.getSurveyInfo(survey)
        const messageLangCode = Survey.getDefaultLanguage(surveyInfo)

        const reportItemsQueryStream = await CollectImportService.fetchReportItemsStream({ surveyId, messageLangCode })

        const fields = ['id', 'node_def_uuid', 'node_def_name', 'type', 'expression', 'apply_if', 'message', 'resolved']

        const fileName = ExportFileNameGenerator.generate({
          survey,
          fileType: 'collect-report',
          includeTimestamp: true,
          fileFormat,
        })
        Response.setContentTypeFile({ res, fileName, fileFormat })

        await DbUtils.stream({
          queryStream: reportItemsQueryStream,
          processor: async (dbStream) =>
            FlatDataWriter.writeItemsStreamToStream({ stream: dbStream, outputStream: res, fields, fileFormat }),
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
