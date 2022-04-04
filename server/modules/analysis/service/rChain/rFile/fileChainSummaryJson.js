import * as FileUtils from '@server/utils/file/fileUtils'
import * as AnalysisService from '@server/modules/analysis/service'

const fileName = 'chain_summary.json'

const initFile = async ({ dir, surveyId, chainUuid }) => {
  const chainSummary = await AnalysisService.fetchChainSummary({ surveyId, chainUuid })
  const fileDest = FileUtils.join(dir, fileName)
  await FileUtils.writeFile(fileDest, JSON.stringify(chainSummary), null, 4)
  return fileDest
}

export const FileChainSummaryJson = {
  initFile,
}
