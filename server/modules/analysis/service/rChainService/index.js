import { db } from '@server/db/db'

import FileZip from '@server/utils/file/fileZip'
import * as CSVReader from '@server/utils/file/csvReader'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ResultStepView from '@common/surveyRdb/resultStepView'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbMamager from '@server/modules/surveyRdb/manager/surveyRdbManager'

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
  return RChainManager.fetchStepData(survey, cycle, stepUuid)
}

// ==== UPDATE
export const persistResults = async (surveyId, cycle, stepUuid, filePath) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  const [step, calculations] = await Promise.all([
    ProcessingChainManager.fetchStepSummaryByUuid(surveyId, stepUuid),
    ProcessingChainManager.fetchCalculationsByStepUuid(surveyId, stepUuid),
  ])
  const entityDefStep = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entityDefStep)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    const chainUuid = ProcessingStep.getProcessingChainUuid(step)
    await SurveyRdbMamager.deleteNodeResultsByChainUuid({ surveyId, cycle, chainUuid }, tx)

    // Insert node results
    const massiveInsert = new RChainManager.MassiveInsertNodeResults(survey, calculations, tx)
    await CSVReader.createReaderFromStream(stream, null, massiveInsert.push.bind(massiveInsert)).start()
    await massiveInsert.flush()

    // refresh result step materialized view
    const resultStepView = ResultStepView.newResultStepView(step)
    await SurveyRdbMamager.refreshResultStepView({ surveyId, resultStepView }, tx)
  })

  fileZip.close()
}

export const persistUserScripts = async (surveyId, chainUuid, filePath) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const entryNames = fileZip.getEntryNames()
  const findEntry = (name) => entryNames.find((entryName) => !!entryName.match(new RegExp(`\\d{3}-${name}\\.R`)))

  await db.tx(async (tx) => {
    const scriptCommon = await fileZip.getEntryAsText(findEntry('common'))
    await ProcessingChainManager.updateChainScriptCommon(surveyId, chainUuid, scriptCommon, tx)
  })
}
