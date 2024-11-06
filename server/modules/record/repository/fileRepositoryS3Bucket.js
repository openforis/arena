import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import * as ProcessUtils from '@core/processUtils'

const Bucket = ProcessUtils.ENV.fileStorageAwsS3BucketName

const s3Client = new S3Client({
  credentials: {
    accessKeyId: ProcessUtils.ENV.fileStorageAwsAccessKey,
    secretAccessKey: ProcessUtils.ENV.fileStorageAwsSecretAccessKey,
  },
  region: ProcessUtils.ENV.fileStorageAwsS3BucketRegion,
})

const getFileKey = ({ surveyId, fileUuid }) => `surveys/${surveyId}/files/${fileUuid}`

const createCommandParams = ({ surveyId, fileUuid }) => {
  const Key = getFileKey({ surveyId, fileUuid })
  return { Bucket, Key }
}

const fileExists = async (Key) => {
  const command = new HeadObjectCommand({ Bucket, Key })
  const data = await s3Client.send(command)
  return data.$metadata.httpStatusCode === 200
}

export const checkCanAccessS3Bucket = async () => {
  const command = new HeadBucketCommand({ Bucket })
  try {
    await s3Client.send(command)
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
  return s3Client.send(command)
}

export const getFileContentAsStream = async ({ surveyId, fileUuid }) => {
  const command = new GetObjectCommand(createCommandParams({ surveyId, fileUuid }))
  const response = await s3Client.send(command)
  return response.Body
}

export const deleteFiles = async ({ surveyId, fileUuids }) =>
  Promise.all(
    fileUuids.map(async (fileUuid) => {
      const command = new DeleteObjectCommand(createCommandParams({ surveyId, fileUuid }))
      return s3Client.send(command)
    })
  )

const getOldFileKey = ({ surveyId, fileUuid }) => `${surveyId}_${fileUuid}`

const createOldKeyCommandParams = ({ surveyId, fileUuid }) => {
  const Key = getOldFileKey({ surveyId, fileUuid })
  return { Bucket, Key }
}

export const oldKeyFileExists = async ({ surveyId, fileUuid }) => {
  const Key = getOldFileKey({ surveyId, fileUuid })
  return fileExists(Key)
}

export const getOldKeyFileContentAsStream = async ({ surveyId, fileUuid }) => {
  const command = new GetObjectCommand(createOldKeyCommandParams({ surveyId, fileUuid }))
  const response = await s3Client.send(command)
  return response.Body
}
