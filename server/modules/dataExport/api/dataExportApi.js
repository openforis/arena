import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'
import { FileFormats } from '@core/fileFormats'
import { isUuid } from '@core/uuid'

import * as JobUtils from '@server/job/jobUtils'
import * as Request from '@server/utils/request'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { sendTempFileToResponse } from '@server/modules/fileDownload/api/fileDownloadApi'
import * as SurveyService from '@server/modules/survey/service/surveyService'

import * as DataExportService from '../service/dataExportService'

const checkExportUuid = (exportUuid) => {
  if (!isUuid(exportUuid)) {
    throw new Error('Invalid exportUuid specified')
  }
}

export const init = (app) => {
  app.post('/survey/:surveyId/data-export', AuthMiddleware.requireRecordsExportPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, recordUuids, search, options } = Request.getParams(req)

      const user = Request.getUser(req)

      const job = DataExportService.startCsvDataExportJob({
        user,
        surveyId,
        cycle,
        recordUuids,
        search,
        options,
      })
      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })

  app.post(
    '/survey/:surveyId/data-summary-export',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, lang, options } = Request.getParams(req)

        const user = Request.getUser(req)

        const job = DataExportService.startDataSummaryExportJob({ user, surveyId, cycle, lang, options })

        res.json({ job: JobUtils.jobToJSON(job) })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/data-summary-export/:exportUuid',
    AuthMiddleware.requireRecordsExportPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, exportUuid } = Request.getParams(req)

        checkExportUuid(exportUuid)

        const survey = await SurveyService.fetchSurveyById({ surveyId })

        const fileFormat = FileFormats.xlsx
        const outputFileName = ExportFileNameGenerator.generate({
          survey,
          cycle,
          fileType: 'DataSummaryExport',
          fileFormat,
          includeTimestamp: true,
        })

        sendTempFileToResponse({ res, tempFileUuid: exportUuid, fileFormat, outputFileName })
      } catch (error) {
        next(error)
      }
    }
  )
}
