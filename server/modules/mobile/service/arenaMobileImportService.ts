import * as JobManager from '@server/job/jobManager'

import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'
import ArenaMobileDataImportSummaryJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportSummaryJob'

export interface ArenaMobileImportSummaryParams {
  user: any
  filePath: string
  fileId: string
  totalChunks?: number
  totalFileSize?: number
  surveyId: number
  conflictResolutionStrategy: string
}

export interface ArenaMobileImportParams extends ArenaMobileImportSummaryParams {
  skipMissingFiles?: boolean
  reuseUploadedFile?: boolean
  selectedRecordsUuids?: string[]
}

export const startArenaMobileImportJob = (params: ArenaMobileImportParams) => {
  const job = new ArenaMobileDataImportJob({
    skipMissingFiles: false,
    reuseUploadedFile: false,
    ...params,
  })

  JobManager.enqueueJob(job)

  return job
}

export const startArenaMobileImportSummaryJob = (params: ArenaMobileImportSummaryParams) => {
  const job = new ArenaMobileDataImportSummaryJob(params)

  JobManager.enqueueJob(job)

  return job
}
