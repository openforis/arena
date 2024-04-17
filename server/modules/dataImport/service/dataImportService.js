import * as JobManager from '@server/job/jobManager'

import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import DataImportJob from '@server/modules/dataImport/service/DataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'

export const startCollectDataImportJob = ({ user, surveyId, filePath, deleteAllRecords, cycle, forceImport }) => {
  const job = new CollectDataImportJob({
    user,
    surveyId,
    filePath,
    deleteAllRecords,
    cycle,
    forceImport,
  })
  JobManager.executeJobThread(job)
  return job
}

export const startCSVDataImportJob = ({
  user,
  surveyId,
  filePath,
  cycle,
  nodeDefUuid,
  dryRun = false,
  insertNewRecords = false,
  insertMissingNodes = false,
  updateRecordsInAnalysis = false,
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
    abortOnErrors,
  }
  const job = dryRun ? new DataImportValidationJob(jobParams) : new DataImportJob(jobParams)
  JobManager.executeJobThread(job)
  return job
}
