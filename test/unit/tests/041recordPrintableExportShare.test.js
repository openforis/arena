import { createRecordPrintableExportShareService } from '@server/modules/record/service/recordPrintableExportShareService'

const surveyId = 1
const recordUuid = 'record-uuid'
const entityDefUuid = 'entity-def-uuid'
const entityNodeUuid = 'entity-node-uuid'

describe('record printable export share', () => {
  let database
  let shareRepository
  let surveyFileService
  let shareService

  beforeEach(() => {
    database = { tx: jest.fn() }
    shareRepository = {
      deleteByRecordUuid: jest.fn(),
      deleteByRecordUuids: jest.fn(),
      fetchByAccessToken: jest.fn(),
      fetchBySurveyRecordEntityNode: jest.fn(),
      fetchBySurveyRecordEntityNodeForUpdate: jest.fn(),
      incrementDownloadCount: jest.fn(),
      insert: jest.fn(),
      updateOnReexport: jest.fn(),
    }
    surveyFileService = {
      deleteFilesAndContentByUuids: jest.fn(),
      fetchFileContentAsBuffer: jest.fn(),
      fetchFileSummaryByUuid: jest.fn(),
      fetchFilesStatistics: jest.fn().mockResolvedValue({ availableSpace: 10_000_000 }),
      insertFile: jest.fn(),
    }
    shareService = createRecordPrintableExportShareService({ database, shareRepository, surveyFileService })
  })

  test('upsert keeps access token and refreshes expiry', async () => {
    const tx = { name: 'transaction' }
    const existingShare = {
      uuid: 'share-uuid',
      access_token: 'stable-access-token',
      file_uuid: 'old-file-uuid',
      expires_at: new Date('2025-01-01T00:00:00.000Z'),
    }
    const oldFileSummary = { uuid: existingShare.file_uuid }
    database.tx.mockImplementation(async (callback) => callback(tx))
    shareRepository.fetchBySurveyRecordEntityNodeForUpdate.mockResolvedValue(existingShare)
    surveyFileService.fetchFileSummaryByUuid.mockResolvedValue(oldFileSummary)
    surveyFileService.insertFile.mockImplementation(async (_surveyId, file) => file)

    const result = await shareService.upsertShareWithPdf({
      surveyId,
      recordUuid,
      entityDefUuid,
      entityNodeUuid,
      pdfBuffer: Buffer.from('pdf'),
    })

    expect(result.accessToken).toBe(existingShare.access_token)
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(result.expiresAt.getTime()).toBeGreaterThan(existingShare.expires_at.getTime())
    expect(shareRepository.updateOnReexport).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: existingShare.uuid,
        expiresAt: result.expiresAt,
      }),
      tx
    )
  })

  test('fetchValidPdfByToken returns null when expired', async () => {
    shareRepository.fetchByAccessToken.mockResolvedValue({
      uuid: 'share-uuid',
      survey_id: surveyId,
      file_uuid: 'file-uuid',
      expires_at: new Date(Date.now() - 1),
    })

    const result = await shareService.fetchValidPdfByToken({ token: 'expired-token' })

    expect(result).toBeNull()
    expect(surveyFileService.fetchFileSummaryByUuid).not.toHaveBeenCalled()
  })

  test('fetchValidPdfByToken returns null for unknown token', async () => {
    shareRepository.fetchByAccessToken.mockResolvedValue(null)

    const result = await shareService.fetchValidPdfByToken({ token: 'unknown-token' })

    expect(result).toBeNull()
    expect(surveyFileService.fetchFileSummaryByUuid).not.toHaveBeenCalled()
  })

  test('deleteByRecordUuid deletes files referenced by removed shares', async () => {
    const client = { name: 'client' }
    shareRepository.deleteByRecordUuid.mockResolvedValue([
      { file_uuid: 'file-1' },
      { file_uuid: null },
      { file_uuid: 'file-2' },
    ])

    await shareService.deleteByRecordUuid({ surveyId, recordUuid }, client)

    expect(surveyFileService.deleteFilesAndContentByUuids).toHaveBeenCalledWith(
      { surveyId, fileUuids: ['file-1', 'file-2'] },
      client
    )
  })

  test('upsert continues when previous file summary is missing', async () => {
    const tx = { name: 'transaction' }
    const existingShare = {
      uuid: 'share-uuid',
      access_token: 'stable-access-token',
      file_uuid: 'missing-file-uuid',
    }
    database.tx.mockImplementation(async (callback) => callback(tx))
    shareRepository.fetchBySurveyRecordEntityNodeForUpdate.mockResolvedValue(existingShare)
    surveyFileService.fetchFileSummaryByUuid.mockResolvedValue(null)
    surveyFileService.insertFile.mockImplementation(async (_surveyId, file) => file)

    const result = await shareService.upsertShareWithPdf({
      surveyId,
      recordUuid,
      entityDefUuid,
      entityNodeUuid,
      pdfBuffer: Buffer.from('pdf'),
    })

    expect(result.accessToken).toBe(existingShare.access_token)
    expect(shareRepository.updateOnReexport).toHaveBeenCalled()
    expect(surveyFileService.deleteFilesAndContentByUuids).not.toHaveBeenCalled()
  })

  test('upsert does not fail export when superseded file cleanup fails', async () => {
    const tx = { name: 'transaction' }
    const existingShare = {
      uuid: 'share-uuid',
      access_token: 'stable-access-token',
      file_uuid: 'old-file-uuid',
    }
    const oldFileSummary = { uuid: existingShare.file_uuid, props: { size: 3 } }
    database.tx.mockImplementation(async (callback) => callback(tx))
    shareRepository.fetchBySurveyRecordEntityNodeForUpdate.mockResolvedValue(existingShare)
    surveyFileService.fetchFileSummaryByUuid.mockResolvedValue(oldFileSummary)
    surveyFileService.insertFile.mockImplementation(async (_surveyId, file) => file)
    surveyFileService.deleteFilesAndContentByUuids.mockRejectedValue(new Error('storage down'))

    const result = await shareService.upsertShareWithPdf({
      surveyId,
      recordUuid,
      entityDefUuid,
      entityNodeUuid,
      pdfBuffer: Buffer.from('pdf'),
    })

    expect(result.accessToken).toBe(existingShare.access_token)
  })

  test('deleteByRecordUuids deletes shares for all records in one call', async () => {
    const client = { name: 'client' }
    shareRepository.deleteByRecordUuids.mockResolvedValue([{ file_uuid: 'file-a' }, { file_uuid: 'file-b' }])

    await shareService.deleteByRecordUuids({ surveyId, recordUuids: ['r1', 'r2'] }, client)

    expect(shareRepository.deleteByRecordUuids).toHaveBeenCalledWith({ surveyId, recordUuids: ['r1', 'r2'] }, client)
    expect(surveyFileService.deleteFilesAndContentByUuids).toHaveBeenCalledWith(
      { surveyId, fileUuids: ['file-a', 'file-b'] },
      client
    )
  })
})
