import {
  checkFileExistsInS3,
  copyObjectInS3,
  createS3BucketRepository,
  deleteObjectFromS3,
} from '@server/modules/file/repository/fileRepositoryS3BucketCommon'

export { checkCanAccessS3Bucket } from '@server/modules/file/repository/fileRepositoryS3BucketCommon'

const getSubfolder = ({ recordUuid }) => (recordUuid ? 'record_files' : 'survey_files')

const getFileKey = ({ surveyId, fileUuid, recordUuid = null }) =>
  `surveys/${surveyId}/${getSubfolder({ recordUuid })}/${fileUuid}`

const getLegacyFileKey = ({ surveyId, fileUuid }) => `${surveyId}_${fileUuid}`

const {
  uploadFileContent,
  getFileContentAsStream: getFileContentAsStreamRaw,
  deleteFile,
} = createS3BucketRepository({
  getFileKey,
})

const deleteFiles = async ({ surveyId, files }) => {
  for (const { fileUuid, recordUuid } of files) {
    await deleteFile({ surveyId, fileUuid, recordUuid })
  }
}

// unlike the shared temp-file repository (where a missing object is always an error), a record
// file registered in the DB can legitimately have no content left in the bucket, so return null
// instead of throwing, matching the other storage backends (filesystem, DB)
const getFileContentAsStream = async (params) => {
  try {
    return await getFileContentAsStreamRaw(params)
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return null
    }
    throw error
  }
}

export const migrateFileToNewKey = async ({ surveyId, fileUuid, recordUuid }) => {
  const legacyKey = getLegacyFileKey({ surveyId, fileUuid })
  const exists = await checkFileExistsInS3({ key: legacyKey })
  if (!exists) {
    return false
  }
  const newKey = getFileKey({ surveyId, fileUuid, recordUuid })
  await copyObjectInS3({ sourceKey: legacyKey, destinationKey: newKey })
  await deleteObjectFromS3({ key: legacyKey })
  return true
}

export { uploadFileContent, getFileContentAsStream, deleteFiles }
