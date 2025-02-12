import * as JobManager from '@server/job/jobManager'
import DataExportJob from '@server/modules/dataExport/service/DataExportJob'

export const startCsvDataExportJob = async ({ user, surveyId, cycle, recordUuids, search, options }) => {
  const job = new DataExportJob({ user, surveyId, cycle, recordUuids, search, options })
  await JobManager.enqueueJob(job)
  return job
}
