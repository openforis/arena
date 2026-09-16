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

const deleteFile = async ({ surveyId, fileSummary }, { surveyFileService }) => {
  const fileUuid = SurveyFile.getUuid(fileSummary)
  await surveyFileService.deleteFilesAndContentByUuids({
    surveyId,
    fileUuids: [fileUuid],
    fallbackFileSummaries: [fileSummary],
  })
}

const persistShareWithPdf = async (
  { surveyId, recordUuid, entityDefUuid, entityNodeUuid, pdfBuffer, requestedAccessToken },
  dependencies
) => {
  const { database, shareRepository, surveyFileService } = dependencies
  const expiresAt = newExpiresAt()
  const stagedFile = createPdfFile({ recordUuid, entityNodeUuid, pdfBuffer })
  let replacedFileSummary = null
  let accessToken

  try {
    accessToken = await database.tx(async (tx) => {
      const existing = await shareRepository.fetchBySurveyRecordEntityNodeForUpdate(
        { surveyId, recordUuid, entityNodeUuid },
        tx
      )

      if (existing) {
        replacedFileSummary = await surveyFileService.fetchFileSummaryByUuid(surveyId, existing.file_uuid, tx)
        if (!replacedFileSummary) {
          throw new Error(`Printable export file not found: ${existing.file_uuid}`)
        }
      }

      const insertedFile = await surveyFileService.insertFile(surveyId, stagedFile, tx)
      const fileUuid = SurveyFile.getUuid(insertedFile)

      if (existing) {
        await shareRepository.updateOnReexport(
          { uuid: existing.uuid, fileUuid, expiresAt, dateModified: new Date() },
          tx
        )
        return existing.access_token
      }

      const accessTokenNew = requestedAccessToken ?? newAccessToken()
      await shareRepository.insert(
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
    await deleteFile({ surveyId, fileSummary: stagedFile }, dependencies)
    throw error
  }

  if (replacedFileSummary) {
    await deleteFile({ surveyId, fileSummary: replacedFileSummary }, dependencies)
  }
  return { accessToken, expiresAt }
}

/**
 * Creates a printable-export share service with replaceable persistence dependencies.
 * @param {object} [dependencies] - Service dependencies.
 * @param {object} [dependencies.database] - Database client.
 * @param {object} [dependencies.shareRepository] - Share repository.
 * @param {object} [dependencies.surveyFileService] - Survey file service.
 * @returns {object} Printable-export share operations.
 */
export const createRecordPrintableExportShareService = ({
  database = db,
  shareRepository = ShareRepository,
  surveyFileService = SurveyFileService,
} = {}) => {
  const dependencies = { database, shareRepository, surveyFileService }

  const upsertShareWithPdf = async ({
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
      return await persistShareWithPdf(params, dependencies)
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error
      }

      const existing = await shareRepository.fetchBySurveyRecordEntityNode({ surveyId, recordUuid, entityNodeUuid })
      if (!existing) {
        throw error
      }
      return persistShareWithPdf(params, dependencies)
    }
  }

  const fetchValidPdfByToken = async ({ token }) => {
    const row = await shareRepository.fetchByAccessToken({ accessToken: token })
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
      return null
    }

    const fileSummary = await surveyFileService.fetchFileSummaryByUuid(row.survey_id, row.file_uuid)
    if (!fileSummary) {
      return null
    }
    const buffer = await surveyFileService.fetchFileContentAsBuffer({ surveyId: row.survey_id, fileSummary })
    if (!buffer) {
      return null
    }

    await shareRepository.incrementDownloadCount({ uuid: row.uuid }).catch(() => undefined)
    return { buffer, contentType: row.content_type || CONTENT_TYPE_PDF }
  }

  const deleteByRecordUuid = async ({ surveyId, recordUuid }, client) => {
    const deleted = await shareRepository.deleteByRecordUuid({ surveyId, recordUuid }, client)
    const fileUuids = deleted.map(({ file_uuid: fileUuid }) => fileUuid).filter(Boolean)
    if (fileUuids.length > 0) {
      await surveyFileService.deleteFilesAndContentByUuids({ surveyId, fileUuids }, client)
    }
  }

  const incrementDownloadCount = async ({ uuid }, client) => shareRepository.incrementDownloadCount({ uuid }, client)

  return { deleteByRecordUuid, fetchValidPdfByToken, incrementDownloadCount, upsertShareWithPdf }
}

export const { deleteByRecordUuid, fetchValidPdfByToken, incrementDownloadCount, upsertShareWithPdf } =
  createRecordPrintableExportShareService()
