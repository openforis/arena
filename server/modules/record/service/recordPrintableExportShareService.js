import { randomBytes } from 'node:crypto'

import SystemError from '@core/systemError'
import * as SurveyFile from '@core/survey/surveyFile'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'

import * as ShareRepository from '../repository/recordPrintableExportShareRepository'

const Logger = Log.getLogger('RecordPrintableExportShareService')

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

const deleteFileBestEffort = async ({ surveyId, fileSummary }, dependencies, context) => {
  try {
    await deleteFile({ surveyId, fileSummary }, dependencies)
  } catch (error) {
    Logger.warn(
      `${context}: failed to delete survey file ${SurveyFile.getUuid(fileSummary)} for survey ${surveyId}: ${error}`
    )
  }
}

const assertQuotaAllowsInsert = async ({ surveyId, pdfBuffer, reclaimableBytes = 0 }, { surveyFileService }) => {
  if (typeof surveyFileService.fetchFilesStatistics !== 'function') {
    return
  }
  const pdfSize = Buffer.byteLength(pdfBuffer)
  const { availableSpace } = await surveyFileService.fetchFilesStatistics({ surveyId })
  if (availableSpace + reclaimableBytes < pdfSize) {
    throw new SystemError('cannotInsertFileExceedingQuota')
  }
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
        // Missing predecessor (migration / manual cleanup): treat as nothing to replace.
      }

      const reclaimableBytes = replacedFileSummary ? SurveyFile.getSize(replacedFileSummary) || 0 : 0
      await assertQuotaAllowsInsert({ surveyId, pdfBuffer, reclaimableBytes }, dependencies)

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
    await deleteFileBestEffort(
      { surveyId, fileSummary: stagedFile },
      dependencies,
      'persistShareWithPdf rollback cleanup'
    )
    throw error
  }

  if (replacedFileSummary) {
    // Share already points at the new file; do not fail the export if old-blob cleanup fails.
    await deleteFileBestEffort(
      { surveyId, fileSummary: replacedFileSummary },
      dependencies,
      'persistShareWithPdf superseded file cleanup'
    )
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

    try {
      await shareRepository.incrementDownloadCount({ uuid: row.uuid })
    } catch (error) {
      Logger.warn(`failed to increment download_count for share ${row.uuid}: ${error}`)
    }
    return { buffer, contentType: row.content_type || CONTENT_TYPE_PDF }
  }

  const deleteByRecordUuid = async ({ surveyId, recordUuid }, client) => {
    const deleted = await shareRepository.deleteByRecordUuid({ surveyId, recordUuid }, client)
    const fileUuids = deleted.map(({ file_uuid: fileUuid }) => fileUuid).filter(Boolean)
    if (fileUuids.length > 0) {
      await surveyFileService.deleteFilesAndContentByUuids({ surveyId, fileUuids }, client)
    }
  }

  const deleteByRecordUuids = async ({ surveyId, recordUuids }, client) => {
    if (!recordUuids?.length) {
      return
    }
    const deleted = await shareRepository.deleteByRecordUuids({ surveyId, recordUuids }, client)
    const fileUuids = deleted.map(({ file_uuid: fileUuid }) => fileUuid).filter(Boolean)
    if (fileUuids.length > 0) {
      await surveyFileService.deleteFilesAndContentByUuids({ surveyId, fileUuids }, client)
    }
  }

  const incrementDownloadCount = async ({ uuid }, client) => shareRepository.incrementDownloadCount({ uuid }, client)

  return {
    deleteByRecordUuid,
    deleteByRecordUuids,
    fetchValidPdfByToken,
    incrementDownloadCount,
    upsertShareWithPdf,
  }
}

export const {
  deleteByRecordUuid,
  deleteByRecordUuids,
  fetchValidPdfByToken,
  incrementDownloadCount,
  upsertShareWithPdf,
} = createRecordPrintableExportShareService()
