import * as JobManager from '@server/job/jobManager'
import DataExportJob from '@server/modules/dataExport/service/dataExportJob'

export const startCsvDataExportJob = ({ user, surveyId, cycle, recordUuids, search, options }) => {
  const job = new DataExportJob({ user, surveyId, cycle, recordUuids, search, options })
  JobManager.enqueueJob(job)
  return job
}

export const startDataSummaryExportJob = ({ user, surveyId, cycle }) => {
  const job = new DataExportJob({ user, surveyId, cycle })
  JobManager.enqueueJob(job)
  return job
}
