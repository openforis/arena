import * as JobManager from '@server/job/jobManager'
import * as OdkImportReportManager from '../manager/odkImportReportManager'
import OdkImportJob from './odkImport/odkImportJob'

/**
 * Starts a background job that imports an uploaded XForm XML file as a new Arena survey.
 * @param params - Function parameters.
 * @param params.user - The user performing the import.
 * @param params.filePath - Path to the (already merged, if chunked) uploaded XForm file.
 * @param params.fileId - Chunked-upload file id, if the file is still being merged.
 * @param params.totalChunks - Total chunk count, if the file is still being merged.
 * @param params.totalFileSize - Total file size, if the file is still being merged.
 * @param params.newSurvey - Optional survey overrides (e.g. { name }).
 * @returns The started job.
 */
export const startOdkImportJob = ({
  user,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  newSurvey,
}: {
  user: any
  filePath?: string
  fileId?: string
  totalChunks?: number
  totalFileSize?: number
  newSurvey?: any
}) => {
  const job = new OdkImportJob({ user, filePath, fileId, totalChunks, totalFileSize, newSurvey })

  JobManager.enqueueJob(job)

  return job
}

// REPORT ITEMS

// READ
export const fetchReportItems = OdkImportReportManager.fetchItems
export const fetchReportItemsStream = OdkImportReportManager.fetchItemsStream
export const countReportItems = OdkImportReportManager.countItems

// UPDATE
export const updateReportItem = async (surveyId: number, itemId: number, resolved: boolean) =>
  OdkImportReportManager.updateItem(surveyId, itemId, {}, resolved)
