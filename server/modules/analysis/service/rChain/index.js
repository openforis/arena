import { db } from '../../../../db/db'

import FileZip from '../../../../utils/file/fileZip'
import * as CSVReader from '../../../../utils/file/csvReader'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Chain from '../../../../../common/analysis/processingChain'
import * as Step from '../../../../../common/analysis/processingStep'
import * as Calculation from '../../../../../common/analysis/processingStepCalculation'
import { TableChain, TableCalculation } from '../../../../../common/model/db'
import { Query } from '../../../../../common/model/query'

import * as SurveyManager from '../../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../../../surveyRdb/manager/surveyRdbManager'
import * as AnalysisManager from '../../manager'

import RChain from './rChain'
import RStep from './rStep'

export const generateScript = async ({ surveyId, cycle, chainUuid, serverUrl }) =>
  new RChain(surveyId, cycle, chainUuid, serverUrl).init()

// ==== READ
export const fetchEntityData = async ({ surveyId, cycle, entityDefUuid }) => {
  const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const query = Query.create({ entityDefUuid })

  return SurveyRdbManager.fetchViewData({ survey: surveyAndNodeDefs, cycle, query, columnNodeDefs: true })
}

// ==== UPDATE

export const _persistResults = async ({ surveyId, cycle, stepUuid, filePath }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  const step = await AnalysisManager.fetchStep({ surveyId, stepUuid, includeCalculations: true })

  const entityDefStep = Survey.getNodeDefByUuid(Step.getEntityUuid(step))(survey)

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entityDefStep)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    const chainUuid = Step.getProcessingChainUuid(step)
    await SurveyRdbManager.deleteNodeResultsByChainUuid({ surveyId, cycle, chainUuid }, tx)

    // Insert node results
    const massiveInsert = new SurveyRdbManager.MassiveInsertResultNodes(survey, step, tx)
    await CSVReader.createReaderFromStream(stream, null, massiveInsert.push.bind(massiveInsert)).start()
    await massiveInsert.flush()

    // refresh result step materialized view
    //await SurveyRdbManager.refreshResultStepView({ survey, step }, tx)
  })

  fileZip.close()
}

export const persistResults = async ({ surveyId, cycle, entityDefUuid, chainUuid, filePath }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  const chain = await AnalysisManager.fetchChain({
    surveyId,
    chainUuid,
    includeScript: true,
    includeChainNodeDefs: true,
  })

  const entity = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entity)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    await SurveyRdbManager.deleteNodeResultsByChainUuid({ surveyId, cycle, chainUuid }, tx)

    // Insert node results
    const massiveInsert = new SurveyRdbManager.MassiveInsertResultNodes(survey, entity, chain, tx)
    await CSVReader.createReaderFromStream(stream, null, massiveInsert.push.bind(massiveInsert)).start()
    await massiveInsert.flush()

  //   DELETE
  // FROM
  //     survey_1_data."_res_node"
  // WHERE
  //     processing_chain_uuid = $1
  // AND record_uuid IN
  // (
  //     SELECT _r.uuid
  //     FROM survey_1."record" AS _r
  //     WHERE _r.cycle = $2
  // )


    // refresh result step materialized view
    // await SurveyRdbManager.refreshResultStepView({ survey, step }, tx)
  })

  fileZip.close()
}

export const persistUserScripts = async ({ surveyId, chainUuid, filePath }) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()

  const entryNames = fileZip.getEntryNames()

  const findEntry = (folder, name) =>
    entryNames.find((entryName) => new RegExp(`^${folder}\\/\\d{3}-${name}\\.R$`).test(entryName))

  await db.tx(async (tx) => {
    // Persist common script
    const scriptCommon = (await fileZip.getEntryAsText(findEntry(RChain.dirNames.user, 'common'))).trim()
    await AnalysisManager.updateChain(
      { surveyId, chainUuid, fields: { [TableChain.columnSet.scriptCommon]: scriptCommon } },
      tx
    )

    // TODO persist chainNodeDefScripts
    // Persist calculation scripts
    const [chain, survey] = await Promise.all([
      AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true, includeStepsAndCalculations: true }, tx),
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }),
    ])
    await Promise.all(
      Chain.getProcessingSteps(chain).map((step) => {
        const stepFolder = `${RChain.dirNames.user}/${RStep.getSubFolder(step)}`
        return Promise.all(
          Step.getCalculations(step).map(async (calculation) => {
            // Persist the script of each calculation
            const calculationUuid = Calculation.getUuid(calculation)
            const nodeDefUuid = Calculation.getNodeDefUuid(calculation)
            const nodeDefName = NodeDef.getName(Survey.getNodeDefByUuid(nodeDefUuid)(survey))
            const script = (await fileZip.getEntryAsText(findEntry(stepFolder, nodeDefName))).trim()
            return AnalysisManager.updateCalculation(
              { surveyId, calculationUuid, fields: { [TableCalculation.columnSet.script]: script } },
              tx
            )
          })
        )
      })
    )
  })
}
