import type { Router } from 'express'

import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as Request from '@server/utils/request'
import { requireRecordCreatePermission } from '../../auth/authApiMiddleware'
import * as DataImportService from '../service/dataImportService'
import { DataImportTemplateService } from '../service/dataImportTemplateService'

const uriPrefix = '/survey/:surveyId/data-import'

export const init = (app: Router) => {
  app.post(`${uriPrefix}/collect`, requireRecordCreatePermission, async (req, res) => {
    const user = Request.getUser(req)
    const { surveyId, deleteAllRecords, cycle, forceImport } = Request.getParams(req)
    const file = Request.getFile(req)

    const job = await DataImportService.startCollectDataImportJob({
      user,
      surveyId,
      filePath: file.tempFilePath,
      deleteAllRecords,
      cycle,
      forceImport,
    })
    const jobSerialized = JobUtils.jobToJSON(job)
    res.json({ job: jobSerialized })
  })

  app.post(`${uriPrefix}/flat-data`, requireRecordCreatePermission, async (req, res) => {
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
      deleteExistingEntities,
      abortOnErrors,
    } = Request.getParams(req)

    // rejected on the first chunk, before the whole file is uploaded
    DataImportService.checkFlatDataImportOptions({ user, includeFiles, deleteExistingEntities })

    const tempFile = await processChunkedFileForBackgroundMerge({ req })
    if (tempFile) {
      const job = DataImportService.startFlatDataImportJob({
        user,
        surveyId,
        ...tempFile,
        fileFormat,
        cycle,
        nodeDefUuid,
        dryRun,
        insertNewRecords,
        insertMissingNodes,
        updateRecordsInAnalysis,
        includeFiles,
        deleteExistingEntities,
        abortOnErrors,
      })
      const jobSerialized = JobUtils.jobToJSON(job)
      res.json({ job: jobSerialized })
    } else {
      res.json({ chunkProcessing: true })
    }
  })

  app.get(`${uriPrefix}/flat-data/template`, requireRecordCreatePermission, async (req, res) => {
    const { surveyId, nodeDefUuid, cycle, includeFiles, fileFormat } = Request.getParams(req)

    await DataImportTemplateService.exportDataImportTemplate({
      surveyId,
      cycle,
      nodeDefUuid,
      includeFiles,
      fileFormat,
      res,
    })
  })

  app.get(`${uriPrefix}/flat-data/templates`, requireRecordCreatePermission, async (req, res) => {
    const { surveyId, cycle, includeFiles, fileFormat } = Request.getParams(req)

    await DataImportTemplateService.exportAllDataImportTemplates({ surveyId, cycle, fileFormat, includeFiles, res })
  })
}
