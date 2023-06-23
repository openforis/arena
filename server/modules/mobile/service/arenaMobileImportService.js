import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'

// ARENA SURVEY IMPORT
export const startArenaMobileImportJob = ({ user, filePath, survey, conflictResolutionStrategy }) => {
  const job = new ArenaMobileDataImportJob({ user, filePath, survey, conflictResolutionStrategy })

  JobManager.executeJobThread(job)

  return job
}
