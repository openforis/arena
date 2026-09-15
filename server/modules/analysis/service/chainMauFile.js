import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as FileUtils from '@server/utils/file/fileUtils'

const { SurveyFileType } = SurveyFile

export const fetchChainMauFileSummary = async ({ surveyId, chainUuid }, client = undefined) => {
  const summaries = await SurveyFileService.fetchFileSummariesByType(
    { surveyId, type: SurveyFileType.chainMau },
    client
  )
  return summaries.find((summary) => SurveyFile.getChainUuid(summary) === chainUuid) ?? null
}

export const deleteChainMauFile = async ({ surveyId, chainUuid }, client = undefined) => {
  const existingSummary = await fetchChainMauFileSummary({ surveyId, chainUuid }, client)
  if (existingSummary) {
    await SurveyFileService.deleteFilesAndContent({ surveyId, fileSummaries: [existingSummary] }, client)
  }
}

export const uploadChainMauFile = async ({ surveyId, chainUuid, filePath, fileName, fileSize }) => {
  const existingSummary = await fetchChainMauFileSummary({ surveyId, chainUuid })

  const content = await FileUtils.readBinaryFile(filePath)
  const file = SurveyFile.createFile({
    name: fileName,
    size: fileSize,
    content,
    chainUuid,
    type: SurveyFileType.chainMau,
  })
  await SurveyFileService.insertFile(surveyId, file)

  if (existingSummary) {
    await SurveyFileService.deleteFilesAndContent({ surveyId, fileSummaries: [existingSummary] })
  }
  return file
}

export const fetchChainMauFileContent = async ({ surveyId, chainUuid }) => {
  const summary = await fetchChainMauFileSummary({ surveyId, chainUuid })
  if (!summary) return null

  const contentStream = await SurveyFileService.fetchFileContentAsStream({ surveyId, fileSummary: summary })
  return { summary, contentStream }
}
