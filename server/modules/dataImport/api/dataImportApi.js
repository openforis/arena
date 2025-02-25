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

  app.post(`${uriPrefix}/flat-data`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const {
        fileFormat,
        surveyId,
        cycle,
        nodeDefUuid,
        dryRun,
        insertNewRecords,
        insertMissingNodes,
        updateRecordsInAnalysis,
        includeFiles,
        abortOnErrors,
      } = Request.getParams(req)
      const filePath = Request.getFilePath(req)

      const job = DataImportService.startFlatDataImportJob({
        user,
        surveyId,
        filePath,
        fileFormat,
        cycle,
        nodeDefUuid,
        dryRun,
        insertNewRecords,
        insertMissingNodes,
        updateRecordsInAnalysis,
        includeFiles,
        abortOnErrors,
      })
      const jobSerialized = JobUtils.jobToJSON(job)
      res.json({ job: jobSerialized })
    } catch (error) {
      next(error)
    }
  })

  app.get(`${uriPrefix}/flat-data/template`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const { surveyId, nodeDefUuid, cycle, includeFiles, fileFormat } = Request.getParams(req)

      await DataImportTemplateService.exportDataImportTemplate({
        surveyId,
        cycle,
        nodeDefUuid,
        includeFiles,
        fileFormat,
        res,
      })
    } catch (error) {
      next(error)
    }
  })

  app.get(`${uriPrefix}/flat-data/templates`, requireRecordCreatePermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, includeFiles, fileFormat } = Request.getParams(req)

      await DataImportTemplateService.exportAllDataImportTemplates({ surveyId, cycle, fileFormat, includeFiles, res })
    } catch (error) {
      next(error)
    }
  })
}
