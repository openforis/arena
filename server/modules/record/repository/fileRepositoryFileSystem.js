import * as ProcessUtils from '@core/processUtils'
import * as RecordFile from '@core/record/recordFile'
import * as FileUtils from '@server/utils/file/fileUtils'

export const getStorageFolderPath = () => ProcessUtils.ENV.storageFilePath

export const getSurveyFilesStorageFolderPath = ({ surveyId }) =>
  FileUtils.join(ProcessUtils.ENV.storageFilePath, surveyId)

const getFilePath = ({ surveyId, fileUuid }) => {
  const storageFolderPath = getSurveyFilesStorageFolderPath({ surveyId })
  return FileUtils.join(storageFolderPath, fileUuid)
}

export const checkCanAccessStorageFolder = async () => {
  const storageFolderPath = getStorageFolderPath()
  if (!FileUtils.existsDir(storageFolderPath)) {
    await FileUtils.mkdir(storageFolderPath)
  }
  if (FileUtils.canReadWritePath(storageFolderPath)) {
    return true
  }
  return false
}

export const writeFileContent = async ({ surveyId, fileUuid, content }) => {
  const storageFolderPath = getSurveyFilesStorageFolderPath({ surveyId })
  await FileUtils.mkdir(storageFolderPath)
  const filePath = getFilePath({ surveyId, fileUuid })
  await FileUtils.writeFile(filePath, content)
}

export const readFileContent = async ({ surveyId, file }) => {
  const filePath = getFilePath({ surveyId, fileUuid: RecordFile.getUuid(file) })
  const content = await FileUtils.readBinaryFile(filePath)
  return content
}

export const deleteFiles = async ({ surveyId, fileUuids }) => {
  await Promise.all(
    fileUuids.map(async (fileUuid) => {
      const filePath = getFilePath({ surveyId, fileUuid })
      await FileUtils.deleteFileAsync(filePath)
    })
  )
}
