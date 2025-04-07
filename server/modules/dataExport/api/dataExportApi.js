import { isUuid } from '@core/uuid'

import * as Response from '@server/utils/response'
import * as Request from '@server/utils/request'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as JobUtils from '@server/job/jobUtils'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as DataExportService from '../service/dataExportService'

const checkExportUuid = (exportUuid) => {
  if (!isUuid(exportUuid)) {
    throw new Error('Invalid exportUuid specified')
  }
}

const sendExportFileToResponse = ({ res, exportUuid, extension, fileName, contentType }) => {
  const tempFilePath = FileUtils.tempFilePath(`${exportUuid}.${extension}`)
  Response.sendFile({
    res,
    path: tempFilePath,
    name: fileName,
    contentType,
    onEnd: async () => FileUtils.deleteFile(tempFilePath),
  })
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

  // get zip with csv
  app.get(
    '/survey/:surveyId/data-export/:exportUuid',
    AuthMiddleware.requireRecordsExportPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, exportUuid } = Request.getParams(req)

        checkExportUuid(exportUuid)

        const survey = await SurveyService.fetchSurveyById({ surveyId, draft: true })

        const extension = 'zip'
        const fileName = ExportFileNameGenerator.generate({
          survey,
          cycle,
          fileType: 'DataExport',
          extension,
          includeTimestamp: true,
        })
        const contentType = Response.contentTypes.zip
        sendExportFileToResponse({ res, exportUuid, extension, fileName, contentType })
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/data-summary-export',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, options } = Request.getParams(req)

        const user = Request.getUser(req)

        const job = DataExportService.startDataSummaryExportJob({ user, surveyId, cycle, options })

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

        const extension = 'csv'
        const contentType = Response.contentTypes.csv
        const fileName = ExportFileNameGenerator.generate({
          survey,
          cycle,
          fileType: 'DataSummaryExport',
          extension: 'csv',
          includeTimestamp: true,
        })

        sendExportFileToResponse({ res, exportUuid, extension, fileName, contentType })
      } catch (error) {
        next(error)
      }
    }
  )
}
