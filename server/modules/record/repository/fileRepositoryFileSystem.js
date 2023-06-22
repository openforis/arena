import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

export const getStorageFolderPath = () => ProcessUtils.ENV.fileStoragePath

export const getSurveyFilesStorageFolderPath = ({ surveyId }) =>
  FileUtils.join(ProcessUtils.ENV.fileStoragePath, surveyId)

const getFilePath = ({ surveyId, fileUuid }) => {
  const storageFolderPath = getSurveyFilesStorageFolderPath({ surveyId })
  return FileUtils.join(storageFolderPath, fileUuid)
}

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

export const writeFileContent = async ({ surveyId, fileUuid, content }) => {
  const storageFolderPath = getSurveyFilesStorageFolderPath({ surveyId })
  await FileUtils.mkdir(storageFolderPath)
  const filePath = getFilePath({ surveyId, fileUuid })
  await FileUtils.writeFile(filePath, content)
}

export const getFileContentAsStream = ({ surveyId, fileUuid }) => {
  const filePath = getFilePath({ surveyId, fileUuid })
  if (!FileUtils.exists(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return FileUtils.createReadStream(filePath)
}

export const deleteFiles = async ({ surveyId, fileUuids }) =>
  Promise.all(
    fileUuids.map(async (fileUuid) => {
      const filePath = getFilePath({ surveyId, fileUuid })
      await FileUtils.deleteFileAsync(filePath)
    })
  )
