import * as JobManager from '@server/job/jobManager'
import DataExportJob from './dataExportJob'
import DataSummaryExportJob from './DataSummaryExportJob'

export const startCsvDataExportJob = ({ user, surveyId, cycle, recordUuids, search, options }) => {
  const job = new DataExportJob({ user, surveyId, cycle, recordUuids, search, options })
  JobManager.enqueueJob(job)
  return job
}

export const startDataSummaryExportJob = ({ user, surveyId, cycle, options }) => {
  const job = new DataSummaryExportJob({ user, surveyId, cycle, options })
  JobManager.enqueueJob(job)
  return job
}
