import * as Request from '@server/utils/request'
import * as JobUtils from '@server/job/jobUtils'

import * as DataImportService from '../service/dataImportService'
import { DataImportTemplateService } from '../service/dataImportTemplateService'

import { requireRecordCreatePermission } from '../../auth/authApiMiddleware'

const uriPrefix = '/survey/:surveyId/data-import'

export const init = (app) => {
  app.post(`${uriPrefix}/collect`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, deleteAllRecords, cycle, forceImport } = Request.getParams(req)
      const file = Request.getFile(req)

      const job = DataImportService.startCollectDataImportJob({
        user,
        surveyId,
        filePath: file.tempFilePath,
        deleteAllRecords,
        cycle,
        forceImport,
      })
      const jobSerialized = JobUtils.jobToJSON(job)
      res.json({ job: jobSerialized })
    } catch (error) {
      next(error)
    }
  })

  app.post(`${uriPrefix}/csv`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const {
        surveyId,
        cycle,
        nodeDefUuid,
        dryRun,
        insertNewRecords,
        insertMissingNodes,
        updateRecordsInAnalysis,
        abortOnErrors,
      } = Request.getParams(req)
      const filePath = Request.getFilePath(req)

      const job = DataImportService.startCSVDataImportJob({
        user,
        surveyId,
        filePath,
        cycle,
        nodeDefUuid,
        dryRun,
        insertNewRecords,
        insertMissingNodes,
        updateRecordsInAnalysis,
        abortOnErrors,
      })
      const jobSerialized = JobUtils.jobToJSON(job)
      res.json({ job: jobSerialized })
    } catch (error) {
      next(error)
    }
  })

  app.get(`${uriPrefix}/csv/template`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const { surveyId, nodeDefUuid, cycle } = Request.getParams(req)

      await DataImportTemplateService.exportDataImportTemplate({ surveyId, cycle, nodeDefUuid, res })
    } catch (error) {
      next(error)
    }
  })

  app.get(`${uriPrefix}/csv/templates`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      await DataImportTemplateService.exportAllDataImportTemplates({ surveyId, cycle, res })
    } catch (error) {
      next(error)
    }
  })
}
