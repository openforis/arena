import { randomBytes } from 'node:crypto'

import * as SurveyFile from '@core/survey/surveyFile'

import { db } from '@server/db/db'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'

import * as ShareRepository from '../repository/recordPrintableExportShareRepository'

const CONTENT_TYPE_PDF = 'application/pdf'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000
const POSTGRES_UNIQUE_VIOLATION = '23505'

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

const isUniqueViolation = (error) => error?.code === POSTGRES_UNIQUE_VIOLATION

const deleteFile = async ({ surveyId, fileSummary }) => {
  const fileUuid = SurveyFile.getUuid(fileSummary)
  await SurveyFileService.deleteFilesAndContentByUuids({
    surveyId,
    fileUuids: [fileUuid],
    fallbackFileSummaries: [fileSummary],
  })
}

const persistShareWithPdf = async ({
  surveyId,
  recordUuid,
  entityDefUuid,
  entityNodeUuid,
  pdfBuffer,
  requestedAccessToken,
}) => {
  const expiresAt = newExpiresAt()
  const stagedFile = createPdfFile({ recordUuid, entityNodeUuid, pdfBuffer })
  let replacedFileSummary = null
  let accessToken

  try {
    accessToken = await db.tx(async (tx) => {
      const existing = await ShareRepository.fetchBySurveyRecordEntityNodeForUpdate(
        { surveyId, recordUuid, entityNodeUuid },
        tx
      )

      if (existing) {
        replacedFileSummary = await SurveyFileService.fetchFileSummaryByUuid(surveyId, existing.file_uuid, tx)
        if (!replacedFileSummary) {
          throw new Error(`Printable export file not found: ${existing.file_uuid}`)
        }
      }

      const insertedFile = await SurveyFileService.insertFile(surveyId, stagedFile, tx)
      const fileUuid = SurveyFile.getUuid(insertedFile)

      if (existing) {
        await ShareRepository.updateOnReexport(
          { uuid: existing.uuid, fileUuid, expiresAt, dateModified: new Date() },
          tx
        )
        return existing.access_token
      }

      const accessTokenNew = requestedAccessToken ?? newAccessToken()
      await ShareRepository.insert(
        {
          surveyId,
          recordUuid,
          entityDefUuid,
          entityNodeUuid,
          accessToken: accessTokenNew,
          fileUuid,
          contentType: CONTENT_TYPE_PDF,
          expiresAt,
        },
        tx
      )
      return accessTokenNew
    })
  } catch (error) {
    await deleteFile({ surveyId, fileSummary: stagedFile })
    throw error
  }

  if (replacedFileSummary) {
    await deleteFile({ surveyId, fileSummary: replacedFileSummary })
  }
  return { accessToken, expiresAt }
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
  const params = {
    surveyId,
    recordUuid,
    entityDefUuid,
    entityNodeUuid,
    pdfBuffer,
    requestedAccessToken,
  }

  try {
    return await persistShareWithPdf(params)
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error
    }

    const existing = await ShareRepository.fetchBySurveyRecordEntityNode({ surveyId, recordUuid, entityNodeUuid })
    if (!existing) {
      throw error
    }
    return persistShareWithPdf(params)
  }
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
  if (fileUuids.length > 0) {
    await SurveyFileService.deleteFilesAndContentByUuids({ surveyId, fileUuids }, client)
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
