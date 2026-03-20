import { checkCanAccessS3Bucket, createS3BucketRepository } from './fileRepositoryS3BucketCommon'

const getFileKey = ({ surveyId, fileUuid }) => `${surveyId}_${fileUuid}`

const { uploadFileContent, getFileContentAsStream, deleteFiles } = createS3BucketRepository({ getFileKey })

export { checkCanAccessS3Bucket, uploadFileContent, getFileContentAsStream, deleteFiles }
