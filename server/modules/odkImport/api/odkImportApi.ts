import type { Readable } from 'node:stream'
import type { Request as ExpressRequest, Response as ExpressResponse, Router } from 'express'
import { FileFormats } from '@core/fileFormats'

import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as DbUtils from '@server/db/dbUtils'
import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as OdkImportService from '../service/odkImportService'

export const init = (app: Router) => {
  // CREATE

  app.post(
    '/survey/odk-import',
    AuthMiddleware.requireSurveyCreatePermission,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const tempFile = await processChunkedFileForBackgroundMerge({ req })
      if (tempFile) {
        const user = Request.getUser(req)
        const newSurvey = Request.getJsonParam(req, 'survey', {})

        const job = OdkImportService.startOdkImportJob({ user, ...tempFile, newSurvey })
        res.json({ job: JobUtils.jobToJSON(job) })
      } else {
        res.json({ chunkProcessing: true })
      }
    }
  )

  // READ

  app.get(
    '/survey/:surveyId/odk-import/report',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const { surveyId, excludeResolved = false, offset, limit } = Request.getParams(req)

      const list = await OdkImportService.fetchReportItems({ surveyId, excludeResolved, offset, limit })

      res.json({ list })
    }
  )

  app.get(
    '/survey/:surveyId/odk-import/report/export',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const { surveyId, draft = true, fileFormat = FileFormats.xlsx } = Request.getParams(req)

      const survey = await SurveyService.fetchSurveyById({ surveyId, draft })

      const reportItemsQueryStream = await OdkImportService.fetchReportItemsStream({ surveyId })

      const fields = ['id', 'node_def_uuid', 'node_def_name', 'type', 'expression', 'message', 'resolved']

      const fileName = ExportFileNameGenerator.generate({
        survey,
        fileType: 'odk-import-report',
        includeTimestamp: true,
        fileFormat,
      })
      Response.setContentTypeFile({ res, fileName, fileFormat })

      await DbUtils.stream({
        queryStream: reportItemsQueryStream,
        processor: async (dbStream: Readable) =>
          FlatDataWriter.writeItemsStreamToStream({
            stream: dbStream,
            outputStream: res,
            fields,
            options: undefined,
            fileFormat,
          }),
      })
    }
  )

  app.get(
    '/survey/:surveyId/odk-import/report/count',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const { surveyId, excludeResolved } = Request.getParams(req)

      const count = await OdkImportService.countReportItems({ surveyId, excludeResolved })

      res.json({ count })
    }
  )

  // UPDATE

  app.post(
    '/survey/:surveyId/odk-import/report/:itemId/resolve',
    AuthMiddleware.requireSurveyEditPermission,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const { surveyId, itemId, resolved } = Request.getParams(req)

      const item = await OdkImportService.updateReportItem(surveyId, itemId, resolved)

      res.json({ item })
    }
  )
}
