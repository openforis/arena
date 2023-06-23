import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/arenaImport/service/mobileDataImport/arenaMobileDataImportJob'

// ARENA SURVEY IMPORT
export const startArenaMobileImportJob = ({ user, filePath, survey }) => {
  const job = new ArenaMobileDataImportJob({ user, filePath, survey })

  JobManager.executeJobThread(job)

  return job
}
