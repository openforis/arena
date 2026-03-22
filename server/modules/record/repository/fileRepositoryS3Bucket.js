import { createS3BucketRepository } from '@server/modules/file/repository/fileRepositoryS3BucketCommon'

export { checkCanAccessS3Bucket } from '@server/modules/file/repository/fileRepositoryS3BucketCommon'

const getFileKey = ({ surveyId, fileUuid }) => `${surveyId}_${fileUuid}`

const { uploadFileContent, getFileContentAsStream, deleteFiles } = createS3BucketRepository({ getFileKey })

export { uploadFileContent, getFileContentAsStream, deleteFiles }
