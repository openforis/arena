import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { GetObjectCommandOutput, HeadObjectCommandOutput, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3'

import type { Readable } from 'node:stream'

import * as ProcessUtils from '@core/processUtils'

const requestTimeout = 5 * 60 * 1000 // 5 minutes
const requestStreamBufferSize = 64 * 1024

const Bucket = ProcessUtils.ENV.fileStorageAwsS3BucketName

const s3Client = new S3Client({
  credentials: {
    accessKeyId: ProcessUtils.ENV.fileStorageAwsAccessKey,
    secretAccessKey: ProcessUtils.ENV.fileStorageAwsSecretAccessKey,
  },
  region: ProcessUtils.ENV.fileStorageAwsS3BucketRegion,
  requestStreamBufferSize,
})

const _sendCommand = (command: any): Promise<any> => s3Client.send(command, { requestTimeout })

export const checkCanAccessS3Bucket = async () => {
  const command = new HeadBucketCommand({ Bucket })

  try {
    await _sendCommand(command)
    return true
  } catch (error) {
    throw new Error(`Cannot access AWS S3 bucket: ${Bucket}; details: ${error}`)
  }
}

const createCommandParams = ({ getFileKey, params }: { getFileKey: any; params: any }) => ({
  Bucket,
  Key: getFileKey(params),
})

export const checkFileExistsInS3 = async ({ key }: { key: string }) => {
  try {
    const command = new HeadObjectCommand({ Bucket, Key: key })
    await _sendCommand(command)
    return true
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error
  }
}

export const copyObjectInS3 = ({ sourceKey, destinationKey }: { sourceKey: string; destinationKey: string }) => {
  const command = new CopyObjectCommand({
    Bucket,
    CopySource: `${Bucket}/${sourceKey}`,
    Key: destinationKey,
  })
  return _sendCommand(command)
}

export const deleteObjectFromS3 = ({ key }: { key: string }) => {
  const command = new DeleteObjectCommand({ Bucket, Key: key })
  return _sendCommand(command)
}

export const createS3BucketRepository = ({ getFileKey }: { getFileKey: any }) => {
  const uploadFileContent = ({ content, ...params }) => {
    const command = new PutObjectCommand({
      ...createCommandParams({ getFileKey, params }),
      Body: content,
    })
    return _sendCommand(command)
  }

  const uploadFileContentAsStream = ({ contentStream, contentLength = null, ...params }) => {
    const command = new PutObjectCommand({
      ...createCommandParams({ getFileKey, params }),
      Body: contentStream,
      ...(Number.isFinite(contentLength) ? { ContentLength: contentLength } : {}),
    })
    return _sendCommand(command)
  }

  const getFileContentAsStream = async (params) => {
    const command = new GetObjectCommand(createCommandParams({ getFileKey, params }))
    const response: GetObjectCommandOutput = await _sendCommand(command)
    return response.Body as Readable
  }

  const getFileSize = async (params) => {
    const command = new HeadObjectCommand(createCommandParams({ getFileKey, params }))
    const response: HeadObjectCommandOutput = await _sendCommand(command)
    return response.ContentLength
  }

  const deleteFile = async (params) => {
    const command = new DeleteObjectCommand(createCommandParams({ getFileKey, params }))
    try {
      return await _sendCommand(command)
    } catch (error) {
      // ignore error if the object is already missing from the bucket (nothing left to delete);
      // check the specific error name rather than the (ambiguous) 404 status alone, so that e.g. a
      // missing/misconfigured bucket (NoSuchBucket) still fails loudly instead of being swallowed
      if (error.name === 'NoSuchKey') {
        return null
      }
      throw error
    }
  }

  const deleteFiles = async ({ fileUuids, ...params }) => {
    for (const fileUuid of fileUuids) {
      await deleteFile({ ...params, fileUuid }) // NOSONAR
    }
  }

  const listFiles = async ({ prefix }) => {
    if (prefix === undefined || prefix === null) {
      throw new TypeError('Missing S3 list prefix')
    }
    const results = []
    let continuationToken
    do {
      const command = new ListObjectsV2Command({
        Bucket,
        Prefix: prefix,
        ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
      })
      const response: ListObjectsV2CommandOutput = await _sendCommand(command) // NOSONAR
      results.push(...(response.Contents ?? []))
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
    } while (continuationToken)
    return results
  }

  return {
    uploadFileContent,
    uploadFileContentAsStream,
    getFileContentAsStream,
    getFileSize,
    deleteFile,
    deleteFiles,
    listFiles,
  }
}
