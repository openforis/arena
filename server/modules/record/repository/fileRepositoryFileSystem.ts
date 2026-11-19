import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

export const getStorageFolderPath = () => ProcessUtils.ENV.fileStoragePath

export const getSurveyFilesStorageFolderPath = ({ surveyId }: { surveyId: number }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, String(surveyId))

const getSubfolder = ({ recordUuid }: { recordUuid: string }) => (recordUuid ? 'record_files' : 'survey_files')

const getSubfolderPath = ({ surveyId, recordUuid }: { surveyId: number; recordUuid: string }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, String(surveyId), getSubfolder({ recordUuid }))

const getFilePath = ({
  surveyId,
  fileUuid,
  recordUuid = null,
}: {
  surveyId: number
  fileUuid: string
  recordUuid?: string
}) => FileUtils.join(getSubfolderPath({ surveyId, recordUuid }), fileUuid)

const getLegacyFilePath = ({ surveyId, fileUuid }: { surveyId: number; fileUuid: string }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, String(surveyId), fileUuid)

export const checkCanAccessStorageFolder = async () => {
  const storageFolderPath = getStorageFolderPath()
  if (!FileUtils.exists(storageFolderPath)) {
    await FileUtils.mkdir(storageFolderPath)
  }
  if (FileUtils.canReadWritePath(storageFolderPath)) {
    return true
  }
  throw new Error('Cannot access files storage path: ' + getStorageFolderPath())
}

export const writeFileContent = async ({
  surveyId,
  fileUuid,
  content,
  recordUuid = null,
}: {
  surveyId: number
  fileUuid: string
  content: any
  recordUuid?: string
}) => {
  const subfolderPath = getSubfolderPath({ surveyId, recordUuid })
  await FileUtils.mkdir(subfolderPath)
  const filePath = getFilePath({ surveyId, fileUuid, recordUuid })
  await FileUtils.writeFile(filePath, content)
}

export const getFileContentAsStream = ({
  surveyId,
  fileUuid,
  recordUuid = null,
}: {
  surveyId: number
  fileUuid: string
  recordUuid?: string
}) => {
  const filePath = getFilePath({ surveyId, fileUuid, recordUuid })
  if (!FileUtils.exists(filePath)) {
    // the file is registered but its content is missing from storage: let the caller handle it
    // (matches the DB and S3 storage backends, which also return null instead of throwing)
    return null
  }
  return FileUtils.createReadStream(filePath)
}

const deleteFileIfExists = async (filePath: string) => {
  try {
    await FileUtils.deleteFileAsync(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

// files are independent from each other: delete them in parallel
export const deleteFiles = ({
  surveyId,
  files,
}: {
  surveyId: number
  files: { fileUuid: string; recordUuid?: string | null }[]
}) =>
  Promise.all(
    files.map(({ fileUuid, recordUuid }) => deleteFileIfExists(getFilePath({ surveyId, fileUuid, recordUuid })))
  )

export const migrateFileToNewPath = async ({
  surveyId,
  fileUuid,
  recordUuid,
}: {
  surveyId: number
  fileUuid: string
  recordUuid: string
}) => {
  const legacyPath = getLegacyFilePath({ surveyId, fileUuid })
  if (!FileUtils.exists(legacyPath)) {
    return false
  }
  const subfolderPath = getSubfolderPath({ surveyId, recordUuid })
  await FileUtils.mkdir(subfolderPath)
  const newPath = getFilePath({ surveyId, fileUuid, recordUuid })
  await FileUtils.rename(legacyPath, newPath)
  return true
}
