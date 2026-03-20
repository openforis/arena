import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import * as ProcessUtils from '@core/processUtils'

const requestTimeout = 5 * 60 * 1000 // 5 minutes

const Bucket = ProcessUtils.ENV.fileStorageAwsS3BucketName

const s3Client = new S3Client({
  credentials: {
    accessKeyId: ProcessUtils.ENV.fileStorageAwsAccessKey,
    secretAccessKey: ProcessUtils.ENV.fileStorageAwsSecretAccessKey,
  },
  region: ProcessUtils.ENV.fileStorageAwsS3BucketRegion,
})

const _sendCommand = async (command) => s3Client.send(command, { requestTimeout })

export const checkCanAccessS3Bucket = async () => {
  const command = new HeadBucketCommand({ Bucket })

  try {
    await _sendCommand(command)
    return true
  } catch (error) {
    throw new Error(`Cannot access AWS S3 bucket: ${Bucket}; details: ${error}`)
  }
}

const createCommandParams = ({ getFileKey, params }) => ({ Bucket, Key: getFileKey(params) })

export const createS3BucketRepository = ({ getFileKey }) => {
  const uploadFileContent = async ({ content, ...params }) => {
    const command = new PutObjectCommand({
      ...createCommandParams({ getFileKey, params }),
      Body: content,
    })
    return _sendCommand(command)
  }

  const getFileContentAsStream = async (params) => {
    const command = new GetObjectCommand(createCommandParams({ getFileKey, params }))
    const response = await _sendCommand(command)
    return response.Body
  }

  const deleteFile = async (params) => {
    const command = new DeleteObjectCommand(createCommandParams({ getFileKey, params }))
    return _sendCommand(command)
  }

  const deleteFiles = async ({ fileUuids, ...params }) => {
    for (const fileUuid of fileUuids) {
      await deleteFile({ ...params, fileUuid })
    }
  }

  return { uploadFileContent, getFileContentAsStream, deleteFile, deleteFiles }
}
