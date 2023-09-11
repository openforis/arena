import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'

// ARENA SURVEY IMPORT
export const startArenaMobileImportJob = ({ user, filePath, surveyId, conflictResolutionStrategy }) => {
  const job = new ArenaMobileDataImportJob({ user, filePath, surveyId, conflictResolutionStrategy })

  JobManager.executeJobThread(job)

  return job
}
