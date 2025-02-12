import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'

// ARENA SURVEY IMPORT
export const startArenaMobileImportJob = async ({ user, filePath, surveyId, conflictResolutionStrategy }) => {
  const job = new ArenaMobileDataImportJob({ user, filePath, surveyId, conflictResolutionStrategy })

  await JobManager.enqueueJob(job)

  return job
}
