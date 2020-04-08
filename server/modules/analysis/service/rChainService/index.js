import { db } from '@server/db/db'

import FileZip from '@server/utils/file/fileZip'
import * as CSVReader from '@server/utils/file/csvReader'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ProcessingChainManager from '../../manager/processingChainManager'
import * as RChainManager from '../../manager/rChainManager'
import RChain from './rChain'

export const generateScript = async (surveyId, cycle, chainUuid, serverUrl) => {
  const rChain = new RChain(surveyId, cycle, chainUuid, serverUrl)
  await rChain.init()
}

// ==== READ
export const fetchStepData = async (surveyId, cycle, stepUuid) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  const data = await RChainManager.fetchStepData(survey, cycle, stepUuid)
  return data
}

// ==== UPDATE
export const persistResults = async (surveyId, cycle, stepUuid, file) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  const [step, calculations] = await Promise.all([
    ProcessingChainManager.fetchStepSummaryByUuid(surveyId, stepUuid),
    ProcessingChainManager.fetchCalculationsByStepUuid(surveyId, stepUuid),
  ])
  const entityDefStep = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)

  const fileZip = new FileZip(file.tempFilePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entityDefStep)}.csv`)

  await db.tx(async (tx) => {
    const massiveInsert = new RChainManager.MassiveInsertNodeResults(survey, calculations, tx)
    await CSVReader.createReaderFromStream(stream, null, massiveInsert.push.bind(massiveInsert)).start()
    await massiveInsert.flush()
  })

  fileZip.close()
}

// ==== DELETE
export const { deleteNodeResults } = RChainManager
