import * as JobManager from '@server/job/jobManager'
import DataExportJob from '@server/modules/dataExport/service/DataExportJob'

export const startCsvDataExportJob = ({ user, surveyId, cycle, recordUuids, search, options }) => {
  const job = new DataExportJob({
    user,
    surveyId,
    cycle,
    recordUuids,
    search,
    options,
  })

  JobManager.executeJobThread(job)

  return job
}
