import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'
import ArenaMobileDataImportSummaryJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportSummaryJob'

export const startArenaMobileImportJob = ({
  user,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  surveyId,
  conflictResolutionStrategy,
  skipMissingFiles = false,
  reuseUploadedFile = false,
  selectedRecordsUuids = undefined,
}) => {
  const job = new ArenaMobileDataImportJob({
    user,
    filePath,
    fileId,
    totalChunks,
    totalFileSize,
    surveyId,
    conflictResolutionStrategy,
    skipMissingFiles,
    reuseUploadedFile,
    selectedRecordsUuids,
  })

  JobManager.enqueueJob(job)

  return job
}

export const startArenaMobileImportSummaryJob = ({
  user,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  surveyId,
  conflictResolutionStrategy,
}) => {
  const job = new ArenaMobileDataImportSummaryJob({
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
