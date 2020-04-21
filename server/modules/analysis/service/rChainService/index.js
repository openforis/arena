import { db } from '@server/db/db'

import FileZip from '@server/utils/file/fileZip'
import * as CSVReader from '@server/utils/file/csvReader'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbMamager from '@server/modules/surveyRdb/manager/surveyRdbManager'

import * as AnalysisManager from '../../manager'
import * as RChainManager from '../../manager/rChainManager'
import RChain from './rChain'
import RStep from './rStep'

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

  const findEntry = (folder, name) =>
    entryNames.find((entryName) => new RegExp(`^${folder}\\/\\d{3}-${name}\\.R$`).test(entryName))

  await db.tx(async (tx) => {
    // Persist common script
    const scriptCommon = await fileZip.getEntryAsText(findEntry(RChain.dirNames.user, 'common'))
    await AnalysisManager.updateChainScriptCommon({ surveyId, chainUuid, scriptCommon }, tx)

    // Persist calculation scripts
    const [chain, survey] = await Promise.all([
      AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true, includeStepsAndCalculations: true }, tx),
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId),
    ])
    await Promise.all(
      ProcessingChain.getProcessingSteps(chain).map((step) => {
        const stepFolder = `${RChain.dirNames.user}/${RStep.getSubFolder(step)}`
        return Promise.all(
          ProcessingStep.getCalculations(step).map(async (calculation) => {
            // Persist the script of each calculation
            const calculationUuid = ProcessingStepCalculation.getUuid(calculation)
            const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
            const nodeDefName = NodeDef.getName(Survey.getNodeDefByUuid(nodeDefUuid)(survey))
            const script = await fileZip.getEntryAsText(findEntry(stepFolder, nodeDefName))
            return AnalysisManager.updateCalculationScript({ surveyId, calculationUuid, script }, tx)
          })
        )
      })
    )
  })
}
