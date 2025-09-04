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

const getFileKey = ({ surveyId, fileUuid }) => `${surveyId}_${fileUuid}`

const createCommandParams = ({ surveyId, fileUuid }) => ({
  Bucket,
  Key: getFileKey({ surveyId, fileUuid }),
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

export const uploadFileContent = async ({ surveyId, fileUuid, content }) => {
  const command = new PutObjectCommand({
    ...createCommandParams({ surveyId, fileUuid }),
    Body: content,
  })
  return _sendCommand(command)
}

export const getFileContentAsStream = async ({ surveyId, fileUuid }) => {
  const command = new GetObjectCommand(createCommandParams({ surveyId, fileUuid }))
  const response = await _sendCommand(command)
  return response.Body
}

export const deleteFiles = async ({ surveyId, fileUuids }) => {
  for (const fileUuid of fileUuids) {
    const command = new DeleteObjectCommand(createCommandParams({ surveyId, fileUuid }))
    await _sendCommand(command)
  }
}
