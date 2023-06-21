import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import * as ProcessUtils from '@core/processUtils'

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
  const response = await s3Client.send(command)
  return response
}

export const readFileContent = async ({ surveyId, fileUuid }) => {
  const command = new GetObjectCommand(createCommandParams({ surveyId, fileUuid }))
  const response = await s3Client.send(command)
  const content = await response.Body.transformToByteArray()
  return content
}
