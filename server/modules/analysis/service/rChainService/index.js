import { db } from '../../../../db/db'

import FileZip from '../../../../utils/file/fileZip'
import * as CSVReader from '../../../../utils/file/csvReader'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as ProcessingStep from '../../../../../common/analysis/processingStep'

import * as SurveyManager from '../../../survey/manager/surveyManager'
import * as SurveyRdbMamager from '../../../surveyRdb/manager/surveyRdbManager'

import * as AnalysisManager from '../../manager'
import * as ProcessingChainManager from '../../manager/processingChainManager'
import * as RChainManager from '../../manager/rChainManager'

import RChain from './rChain'

export const generateScript = async (surveyId, cycle, chainUuid, serverUrl) => {
  const rChain = new RChain(surveyId, cycle, chainUuid, serverUrl)
  await rChain.init()
}

// ==== READ
export const fetchStepData = async (surveyId, cycle, stepUuid) => {
  const [survey, step] = await Promise.all([
    SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle),
    AnalysisManager.fetchStep({ surveyId, stepUuid }),
  ])
  const nodeDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
  return SurveyRdbMamager.fetchViewData({ survey, cycle, nodeDef, columnNodeDefs: true })
}

// ==== UPDATE
export const persistResults = async (surveyId, cycle, stepUuid, filePath) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  const step = await AnalysisManager.fetchStep({ surveyId, stepUuid, includeCalculations: true })

  const entityDefStep = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entityDefStep)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    const chainUuid = ProcessingStep.getProcessingChainUuid(step)
    await SurveyRdbMamager.deleteNodeResultsByChainUuid({ surveyId, cycle, chainUuid }, tx)

    // Insert node results
    const massiveInsert = new RChainManager.MassiveInsertNodeResults(survey, ProcessingStep.getCalculations(step), tx)
    await CSVReader.createReaderFromStream(stream, null, massiveInsert.push.bind(massiveInsert)).start()
    await massiveInsert.flush()

    // refresh result step materialized view
    await SurveyRdbMamager.refreshResultStepView({ survey, step }, tx)
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
