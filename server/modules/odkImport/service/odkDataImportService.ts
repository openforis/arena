import * as JobManager from '@server/job/jobManager'
import OdkDataImportJob from './odkImport/odkDataImportJob'

/**
 * Starts a background job that imports an ODK Briefcase-style submissions export (zip) into an
 * existing survey's records.
 * @param params - Function parameters.
 * @param params.user - The user performing the import.
 * @param params.surveyId - The target survey id (must already have a matching schema).
 * @param params.filePath - Path to the (already merged, if chunked) uploaded zip.
 * @param params.fileId - Chunked-upload file id, if the file is still being merged.
 * @param params.totalChunks - Total chunk count, if the file is still being merged.
 * @param params.totalFileSize - Total file size, if the file is still being merged.
 * @param params.cycle - The survey cycle to import records into.
 * @returns The started job.
 */
export const startOdkDataImportJob = ({
  user,
  surveyId,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  cycle,
}: {
  user: any
  surveyId: number
  filePath?: string
  fileId?: string
  totalChunks?: number
  totalFileSize?: number
  cycle?: string
}) => {
  const job = new OdkDataImportJob({ user, surveyId, filePath, fileId, totalChunks, totalFileSize, cycle })

  JobManager.enqueueJob(job)

  return job
}
