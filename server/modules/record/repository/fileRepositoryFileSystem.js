import * as ProcessUtils from '@core/processUtils'
import * as RecordFile from '@core/record/recordFile'
import * as FileUtils from '@server/utils/file/fileUtils'

const determineFilePath = ({ surveyId, fileUuid }) => {
  const fileDir = FileUtils.join(ProcessUtils.ENV.storageFilePath, surveyId)
  return FileUtils.join(fileDir, fileUuid)
}

export const writeFileContent = async ({ surveyId, fileUuid, fileContent }) => {
  const fileDir = FileUtils.join(ProcessUtils.ENV.storageFilePath, surveyId)
  await FileUtils.mkdir(fileDir)
  const filePath = determineFilePath({ surveyId, fileUuid })
  await FileUtils.writeFile(filePath, fileContent)
}

export const readFileContent = async ({ surveyId, file }) => {
  const filePath = determineFilePath({ surveyId, fileUuid: RecordFile.getUuid(file) })
  const content = await FileUtils.readBinaryFile(filePath)
  return content
}

export const deleteFiles = async ({ surveyId, fileUuids }) => {
  await Promise.all(
    fileUuids.map(async (fileUuid) => {
      const filePath = determineFilePath({ surveyId, fileUuid })
      await FileUtils.deleteFileAsync(filePath)
    })
  )
}
