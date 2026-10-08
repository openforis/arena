import { S3Client } from '@aws-sdk/client-s3'

import * as ProcessUtils from '@core/processUtils'
import * as RecordFileManager from '@server/modules/record/manager/recordFileManager'

describe('RecordFileManager.deleteFiles with S3 bucket storage', () => {
  const { ENV } = ProcessUtils
  const envOriginal = { ...ENV }
  let sendSpy

  beforeEach(() => {
    ENV.fileStoragePath = undefined
    ENV.fileStorageAwsS3BucketName = 'test-bucket'
    sendSpy = jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({})
  })

  afterEach(() => {
    ENV.fileStoragePath = envOriginal.fileStoragePath
    ENV.fileStorageAwsS3BucketName = envOriginal.fileStorageAwsS3BucketName
    sendSpy.mockRestore()
  })

  const getDeletedKeys = () => sendSpy.mock.calls.map(([command]) => command.input.Key)

  test('deletes the objects of the files from the bucket and the file rows from the DB', async () => {
    const client = { query: jest.fn().mockResolvedValue(undefined) }

    await RecordFileManager.deleteFiles(
      {
        surveyId: 7,
        files: [
          { fileUuid: 'file-uuid-1', recordUuid: 'record-uuid-1' },
          { fileUuid: 'file-uuid-2', recordUuid: 'record-uuid-1' },
        ],
      },
      client
    )

    expect(sendSpy.mock.calls.every(([command]) => command.constructor.name === 'DeleteObjectCommand')).toBe(true)
    expect(getDeletedKeys()).toEqual(['surveys/7/record_files/file-uuid-1', 'surveys/7/record_files/file-uuid-2'])
    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query.mock.calls[0][1]).toEqual([['file-uuid-1', 'file-uuid-2']])
  })

  test('does not fail when an object is already missing from the bucket', async () => {
    sendSpy.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NoSuchKey' }))
    const client = { query: jest.fn().mockResolvedValue(undefined) }

    await RecordFileManager.deleteFiles(
      {
        surveyId: 7,
        files: [
          { fileUuid: 'file-uuid-1', recordUuid: 'record-uuid-1' },
          { fileUuid: 'file-uuid-2', recordUuid: 'record-uuid-1' },
        ],
      },
      client
    )

    expect(getDeletedKeys()).toHaveLength(2)
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  test('keeps the file rows when the deletion of an object fails', async () => {
    sendSpy.mockRejectedValueOnce(Object.assign(new Error('access denied'), { name: 'AccessDenied' }))
    const client = { query: jest.fn().mockResolvedValue(undefined) }

    await expect(
      RecordFileManager.deleteFiles(
        { surveyId: 7, files: [{ fileUuid: 'file-uuid-1', recordUuid: 'record-uuid-1' }] },
        client
      )
    ).rejects.toThrow('access denied')

    expect(client.query).not.toHaveBeenCalled()
  })
})
