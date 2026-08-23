import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

export const getStorageFolderPath = () => ProcessUtils.ENV.fileStoragePath

export const getSurveyFilesStorageFolderPath = ({ surveyId }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, surveyId)

const getSubfolder = ({ recordUuid }) => (recordUuid ? 'record_files' : 'survey_files')

const getSubfolderPath = ({ surveyId, recordUuid }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, surveyId, getSubfolder({ recordUuid }))

const getFilePath = ({ surveyId, fileUuid, recordUuid = null }) =>
  FileUtils.join(getSubfolderPath({ surveyId, recordUuid }), fileUuid)

const getLegacyFilePath = ({ surveyId, fileUuid }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, surveyId, fileUuid)

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

export const writeFileContent = async ({ surveyId, fileUuid, content, recordUuid = null }) => {
  const subfolderPath = getSubfolderPath({ surveyId, recordUuid })
  await FileUtils.mkdir(subfolderPath)
  const filePath = getFilePath({ surveyId, fileUuid, recordUuid })
  await FileUtils.writeFile(filePath, content)
}

export const getFileContentAsStream = ({ surveyId, fileUuid, recordUuid = null }) => {
  const filePath = getFilePath({ surveyId, fileUuid, recordUuid })
  if (!FileUtils.exists(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return FileUtils.createReadStream(filePath)
}

export const deleteFiles = async ({ surveyId, files }) => {
  for (const { fileUuid, recordUuid } of files) {
    const filePath = getFilePath({ surveyId, fileUuid, recordUuid })
    await FileUtils.deleteFileAsync(filePath)
  }
}

export const migrateFileToNewPath = async ({ surveyId, fileUuid, recordUuid }) => {
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
