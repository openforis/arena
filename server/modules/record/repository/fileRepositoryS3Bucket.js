import AWS from 'aws-sdk'

import * as ProcessUtils from '@core/processUtils'

AWS.config.update({
  accessKeyId: ProcessUtils.ENV.fileStorageAwsAccessKey,
  secretAccessKey: ProcessUtils.ENV.fileStorageAwsSecretAccessKey,
  region: ProcessUtils.ENV.fileStorageAwsS3BucketRegion,
})

const s3 = new AWS.S3()

const getFileKey = ({ surveyId, fileUuid }) => `${surveyId}_${fileUuid}`

export const uploadFileContent = async ({ surveyId, fileUuid, content }) => {
  const params = {
    Bucket: ProcessUtils.ENV.fileStorageAwsS3BucketName,
    Key: getFileKey({ surveyId, fileUuid }),
    Body: content,
  }
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
