import { randomBytes } from 'node:crypto'

import * as SurveyFile from '@core/survey/surveyFile'

import * as FileManagerCommon from '@server/modules/file/manager/fileManagerCommon'
import * as FileRepositoryFileSystem from '@server/modules/record/repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '@server/modules/record/repository/fileRepositoryS3Bucket'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'

import * as ShareRepository from '../repository/recordPrintableExportShareRepository'

const CONTENT_TYPE_PDF = 'application/pdf'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

const contentOverwriteFunctionByStorageType = {
  [FileManagerCommon.fileContentStorageTypes.fileSystem]: FileRepositoryFileSystem.writeFileContent,
  [FileManagerCommon.fileContentStorageTypes.s3Bucket]: FileRepositoryS3Bucket.uploadFileContent,
}

const createPdfFile = ({ recordUuid, entityNodeUuid, pdfBuffer }) =>
  SurveyFile.createFile({
    name: `printable-export-${entityNodeUuid}.pdf`,
    size: Buffer.byteLength(pdfBuffer),
    content: pdfBuffer,
    recordUuid,
    nodeUuid: entityNodeUuid,
    type: SurveyFile.SurveyFileType.printableExportPdf,
  })

const newExpiresAt = () => new Date(Date.now() + ONE_YEAR_MS)
const newAccessToken = () => randomBytes(32).toString('base64url')

const overwriteExternalFileContent = async ({ surveyId, fileUuid, recordUuid, content }) => {
  const storageType = FileManagerCommon.getFileContentStorageType()
  const overwriteContent = contentOverwriteFunctionByStorageType[storageType]
  await overwriteContent({ surveyId, fileUuid, recordUuid, content })
}

const updateFileSize = async ({ surveyId, fileSummary, size }) => {
  const fileUuid = SurveyFile.getUuid(fileSummary)
  const fileSummaryUpdated = SurveyFile.assocSize(size)(fileSummary)
  await SurveyFileService.updateFileProps(surveyId, fileUuid, SurveyFile.getProps(fileSummaryUpdated))
}

const replaceDatabaseFile = async ({ surveyId, recordUuid, entityNodeUuid, pdfBuffer, existingFileSummary }) => {
  const replacementFile = createPdfFile({ recordUuid, entityNodeUuid, pdfBuffer })
  const insertedFile = await SurveyFileService.insertFile(surveyId, replacementFile)
  return {
    fileUuid: SurveyFile.getUuid(insertedFile),
    deleteReplacedFile: async () =>
      SurveyFileService.deleteFilesAndContent({ surveyId, fileSummaries: [existingFileSummary] }),
  }
}

const overwriteFile = async ({ surveyId, recordUuid, entityNodeUuid, fileUuid, pdfBuffer }) => {
  const existingFileSummary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid)
  if (!existingFileSummary) {
    throw new Error(`Printable export file not found: ${fileUuid}`)
  }

  if (FileManagerCommon.getFileContentStorageType() === FileManagerCommon.fileContentStorageTypes.db) {
    return replaceDatabaseFile({ surveyId, recordUuid, entityNodeUuid, pdfBuffer, existingFileSummary })
  }

  await overwriteExternalFileContent({ surveyId, fileUuid, recordUuid, content: pdfBuffer })
  await updateFileSize({ surveyId, fileSummary: existingFileSummary, size: Buffer.byteLength(pdfBuffer) })
  return { fileUuid, deleteReplacedFile: async () => undefined }
}

/**
 * Creates or refreshes a printable-export share and stores its PDF.
 * @param {object} params - Share and PDF values.
 * @param {number} params.surveyId - Survey identifier.
 * @param {string} params.recordUuid - Record UUID.
 * @param {string} params.entityDefUuid - Entity definition UUID.
 * @param {string} params.entityNodeUuid - Entity node UUID.
 * @param {Buffer} params.pdfBuffer - PDF bytes.
 * @param {string} [params.accessToken] - Optional precomputed access token.
 * @returns {Promise<{accessToken: string, expiresAt: Date}>} Public token and expiry.
 */
export const upsertShareWithPdf = async ({
  surveyId,
  recordUuid,
  entityDefUuid,
  entityNodeUuid,
  pdfBuffer,
  accessToken: requestedAccessToken,
}) => {
  const existing = await ShareRepository.fetchBySurveyRecordEntityNode({
    surveyId,
    recordUuid,
    entityNodeUuid,
  })
  const expiresAt = newExpiresAt()

  if (existing) {
    const { fileUuid, deleteReplacedFile } = await overwriteFile({
      surveyId,
      recordUuid,
      entityNodeUuid,
      fileUuid: existing.file_uuid,
      pdfBuffer,
    })
    await ShareRepository.updateOnReexport({
      uuid: existing.uuid,
      fileUuid,
      expiresAt,
      dateModified: new Date(),
    })
    await deleteReplacedFile()
    return { accessToken: existing.access_token, expiresAt }
  }

  const accessToken = requestedAccessToken ?? newAccessToken()
  const file = createPdfFile({ recordUuid, entityNodeUuid, pdfBuffer })
  const insertedFile = await SurveyFileService.insertFile(surveyId, file)
  await ShareRepository.insert({
    surveyId,
    recordUuid,
    entityDefUuid,
    entityNodeUuid,
    accessToken,
    fileUuid: SurveyFile.getUuid(insertedFile),
    contentType: CONTENT_TYPE_PDF,
    expiresAt,
  })
  return { accessToken, expiresAt }
}

/**
 * Fetches a non-expired shared PDF by token.
 * @param {object} params - Fetch parameters.
 * @param {string} params.token - Public access token.
 * @returns {Promise<{buffer: Buffer, contentType: string}|null>} PDF data, or null.
 */
export const fetchValidPdfByToken = async ({ token }) => {
  const row = await ShareRepository.fetchByAccessToken({ accessToken: token })
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    return null
  }

  const fileSummary = await SurveyFileService.fetchFileSummaryByUuid(row.survey_id, row.file_uuid)
  if (!fileSummary) {
    return null
  }
  const buffer = await SurveyFileService.fetchFileContentAsBuffer({ surveyId: row.survey_id, fileSummary })
  if (!buffer) {
    return null
  }

  await ShareRepository.incrementDownloadCount({ uuid: row.uuid }).catch(() => undefined)
  return { buffer, contentType: row.content_type || CONTENT_TYPE_PDF }
}

/**
 * Deletes printable export shares and their PDF files for a record.
 * @param {object} params - Delete parameters.
 * @param {number} params.surveyId - Survey identifier.
 * @param {string} params.recordUuid - Record UUID.
 * @param {object} [client] - Optional database client.
 * @returns {Promise<void>} A promise resolved after deletion.
 */
export const deleteByRecordUuid = async ({ surveyId, recordUuid }, client) => {
  const deleted = await ShareRepository.deleteByRecordUuid({ surveyId, recordUuid }, client)
  const fileUuids = deleted.map(({ file_uuid: fileUuid }) => fileUuid).filter(Boolean)
  const fileSummaries = await Promise.all(
    fileUuids.map((fileUuid) => SurveyFileService.fetchFileSummaryByUuid(surveyId, fileUuid, client))
  )
  const existingFileSummaries = fileSummaries.filter(Boolean)
  if (existingFileSummaries.length > 0) {
    await SurveyFileService.deleteFilesAndContent({ surveyId, fileSummaries: existingFileSummaries }, client)
  }
}

/**
 * Increments a printable export share download count.
 * @param {object} params - Update parameters.
 * @param {string} params.uuid - Share UUID.
 * @param {object} [client] - Optional database client.
 * @returns {Promise<void>} A promise resolved after the update.
 */
export const incrementDownloadCount = async ({ uuid }, client) =>
  ShareRepository.incrementDownloadCount({ uuid }, client)
