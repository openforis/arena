import * as JobManager from '@server/job/jobManager'

import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'
import DataImportJob from './DataImportJob/DataImportJob'

export const startCollectDataImportJob = async ({ user, surveyId, filePath, deleteAllRecords, cycle, forceImport }) => {
  const job = new CollectDataImportJob({
    user,
    surveyId,
    filePath,
    deleteAllRecords,
    cycle,
    forceImport,
  })
  await JobManager.enqueueJob(job)
  return job
}

export const startCSVDataImportJob = async ({
  user,
  surveyId,
  filePath,
  cycle,
  nodeDefUuid,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
  includeFiles = false,
  abortOnErrors = true,
}) => {
  const jobParams = {
    user,
    surveyId,
    filePath,
    cycle,
    nodeDefUuid,
    dryRun,
    insertNewRecords,
    insertMissingNodes,
    updateRecordsInAnalysis,
    includeFiles,
    abortOnErrors,
  }
  const job = dryRun ? new DataImportValidationJob(jobParams) : new DataImportJob(jobParams)
  await JobManager.enqueueJob(job)
  return job
}
