import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'

export const startArenaMobileImportJob = ({
  user,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  surveyId,
  conflictResolutionStrategy,
}) => {
  const job = new ArenaMobileDataImportJob({
    user,
    filePath,
    fileId,
    totalChunks,
    totalFileSize,
    surveyId,
    conflictResolutionStrategy,
  })

  JobManager.enqueueJob(job)

  return job
}
