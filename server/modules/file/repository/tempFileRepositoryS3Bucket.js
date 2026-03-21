import { checkCanAccessS3Bucket, createS3BucketRepository } from './fileRepositoryS3BucketCommon'

const getTempFileKey = ({ fileUuid }) => `temp/${fileUuid}`

const { uploadFileContent, getFileContentAsStream, deleteFile, deleteFiles } = createS3BucketRepository({
  getFileKey: getTempFileKey,
})

export { checkCanAccessS3Bucket, uploadFileContent, getFileContentAsStream, deleteFile, deleteFiles }
