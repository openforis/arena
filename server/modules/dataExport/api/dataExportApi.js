import { isUuid } from '@core/uuid'

import * as Response from '@server/utils/response'
import * as Request from '@server/utils/request'
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as JobUtils from '@server/job/jobUtils'

import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as SurveyService from '@server/modules/survey/service/surveyService'

export const init = (app) => {
  // export-csv-data
  // generate zip with CSV
  app.post(
    '/survey/:surveyId/data-export/csv',
    AuthMiddleware.requireRecordsExportPermission,
    async (req, res, next) => {
      try {
        const {
          surveyId,
          cycle,
          recordUuids,
          search,
          includeCategories,
          includeCategoryItemsLabels,
          expandCategoryItems,
          includeAnalysis,
          includeDataFromAllCycles,
          includeFiles,
        } = Request.getParams(req)

        const user = Request.getUser(req)

        const job = SurveyService.startExportCsvDataJob({
          user,
          surveyId,
          cycle,
          recordUuids,
          search,
          includeCategories,
          includeCategoryItemsLabels,
          expandCategoryItems,
          includeAnalysis,
          includeDataFromAllCycles,
          includeFiles,
        })
        res.json({ job: JobUtils.jobToJSON(job) })
      } catch (error) {
        next(error)
      }
    }
  )

  // get zip with csv
  app.get(
    '/survey/:surveyId/data-export/csv/:exportUuid',
    AuthMiddleware.requireRecordsExportPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, exportUuid } = Request.getParams(req)

        if (!isUuid(exportUuid)) {
          throw new Error('Invalid exportUuid specified')
        }

        const tempFilePath = FileUtils.tempFilePath(`${exportUuid}.zip`)

        const survey = await SurveyService.fetchSurveyById({ surveyId, draft: true })
        const fileName = ExportFileNameGenerator.generate({
          survey,
          cycle,
          fileType: 'DataExport',
          extension: 'zip',
          includeTimestamp: true,
        })

        Response.sendFile({
          res,
          path: tempFilePath,
          name: fileName,
          contentType: Response.contentTypes.zip,
          onEnd: async () => FileUtils.deleteFile(tempFilePath),
        })
      } catch (error) {
        next(error)
      }
    }
  )
}
