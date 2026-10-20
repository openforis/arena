import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as FileUtils from '@server/utils/file/fileUtils'

const { SurveyFileType } = SurveyFile

// cycle === undefined matches files associated to any cycle (e.g. when deleting a whole chain)
const matchesChainAndCycle = ({ summary, chainUuid, cycle }) =>
  SurveyFile.getChainUuid(summary) === chainUuid && (cycle === undefined || SurveyFile.getCycle(summary) === cycle)

export const fetchChainMauFileSummary = async ({ surveyId, chainUuid, cycle }, client = undefined) => {
  const summaries = await SurveyFileService.fetchFileSummariesByType(
    { surveyId, type: SurveyFileType.chainMau },
    client
  )
  return summaries.find((summary) => matchesChainAndCycle({ summary, chainUuid, cycle })) ?? null
}

export const deleteChainMauFile = async ({ surveyId, chainUuid, cycle }, client = undefined) => {
  const summaries = await SurveyFileService.fetchFileSummariesByType(
    { surveyId, type: SurveyFileType.chainMau },
    client
  )
  const summariesForChain = summaries.filter((summary) => matchesChainAndCycle({ summary, chainUuid, cycle }))
  if (summariesForChain.length > 0) {
    await SurveyFileService.deleteFilesAndContent({ surveyId, fileSummaries: summariesForChain }, client)
  }
}

export const uploadChainMauFile = async ({ surveyId, chainUuid, cycle, filePath, fileName, fileSize }) => {
  const existingSummary = await fetchChainMauFileSummary({ surveyId, chainUuid, cycle })

  const content = await FileUtils.readBinaryFile(filePath)
  const file = SurveyFile.createFile({
    name: fileName,
    size: fileSize,
    content,
    chainUuid,
    cycle,
    type: SurveyFileType.chainMau,
  })
  await SurveyFileService.insertFile(surveyId, file)

  if (existingSummary) {
    await SurveyFileService.deleteFilesAndContent({ surveyId, fileSummaries: [existingSummary] })
  }
  return file
}

export const fetchChainMauFileContent = async ({ surveyId, chainUuid, cycle }) => {
  const summary = await fetchChainMauFileSummary({ surveyId, chainUuid, cycle })
  if (!summary) return null

  const contentStream = await SurveyFileService.fetchFileContentAsStream({ surveyId, fileSummary: summary })
  return { summary, contentStream }
}
