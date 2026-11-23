import type { Router } from 'express'
import { FileFormats } from '@core/fileFormats'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as DbUtils from '@server/db/dbUtils'
import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as CollectImportService from '../service/collectImportService'

export const init = (app: Router) => {
  // CREATE

  app.post('/survey/collect-import', AuthMiddleware.requireSurveyCreatePermission, async (req, res) => {
    const tempFile = await processChunkedFileForBackgroundMerge({ req })
    if (tempFile) {
      const user = Request.getUser(req)
      const newSurveyParam = Request.getJsonParam(req, 'survey')

      const { options, ...newSurvey } = newSurveyParam

      const validation = await SurveyService.validateSurveyImportFromCollect({ newSurvey })

      if (Validation.isValid(validation)) {
        const job = CollectImportService.startCollectImportJob({
          user,
          ...tempFile,
          newSurvey,
          options,
        })
        res.json({ job: JobUtils.jobToJSON(job) })
      } else {
        res.json({ validation })
      }
    } else {
      res.json({ chunkProcessing: true })
    }
  })

  // READ

  app.get('/survey/:surveyId/collect-import/report', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    const { surveyId, excludeResolved = false, offset, limit } = Request.getParams(req)

    const list = await CollectImportService.fetchReportItems({ surveyId, excludeResolved, offset, limit })

    res.json({ list })
  })

  app.get(
    '/survey/:surveyId/collect-import/report/export',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res) => {
      const { surveyId, draft = true, fileFormat = FileFormats.xlsx } = Request.getParams(req)

      const survey = await SurveyService.fetchSurveyById({ surveyId, draft })
      const surveyInfo = Survey.getSurveyInfo(survey)
      const messageLangCode = Survey.getDefaultLanguage(surveyInfo)

      const reportItemsQueryStream = CollectImportService.fetchReportItemsStream({ surveyId, messageLangCode })

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
        processor: (dbStream) =>
          FlatDataWriter.writeItemsStreamToStream({ stream: dbStream, outputStream: res, fields, fileFormat }),
      })
    }
  )

  app.get(
    '/survey/:surveyId/collect-import/report/count',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res) => {
      const { surveyId, excludeResolved } = Request.getParams(req)

      const count = await CollectImportService.countReportItems({ surveyId, excludeResolved })

      res.json({ count })
    }
  )

  // UPDATE

  app.post(
    '/survey/:surveyId/collect-import/report/:itemId/resolve',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res) => {
      const { surveyId, itemId, resolved } = Request.getParams(req)
      const user = Request.getUser(req)

      const item = await CollectImportService.updateReportItem(user, surveyId, itemId, {}, resolved)

      res.json({ item })
    }
  )
}
