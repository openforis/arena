import * as PromiseUtils from '@core/promiseUtils'

import { db } from '@server/db/db'

import FileZip from '@server/utils/file/fileZip'
import * as CSVReader from '@server/utils/file/csvReader'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as RecordStep from '@core/record/recordStep'

import { TableChain } from '@common/model/db'
import { Query } from '@common/model/query'
import * as Chain from '@common/analysis/chain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as AnalysisManager from '../../manager'

import RChain from './rChain'

export const generateScript = async ({ surveyId, cycle, chainUuid, serverUrl }) =>
  new RChain(surveyId, cycle, chainUuid, serverUrl).init()

// ==== READ
export const fetchNodeData = async ({ res, surveyId, cycle, chainUuid, nodeDefUuid, draft = true }) => {
  // prepare query
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle,
    advanced: true,
    draft,
    includeAnalysis: false,
  })
  const chain = await AnalysisManager.fetchChain({ surveyId, chainUuid })
  const recordSteps = Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)
    ? [RecordStep.getStepIdByName(RecordStep.stepNames.analysis)]
    : null
  const query = Query.create({ entityDefUuid: nodeDefUuid })

  // fetch data
  return SurveyRdbManager.fetchViewData({
    survey,
    cycle,
    recordSteps,
    query,
    columnNodeDefs: true,
    includeFileAttributeDefs: false,
    addCycle: true,
    streamOutput: res,
  })
}

// ==== UPDATE

export const persistResults = async ({ surveyId, cycle, entityDefUuid, chainUuid, filePath }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, advanced: true, draft: true })

  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const chain = await AnalysisManager.fetchChain({
    surveyId,
    chainUuid,
  })

  const analysisNodeDefs = Survey.getAnalysisNodeDefs({
    chain,
    entityDefUuid,
    showSamplingNodeDefs: true,
    hideAreaBasedEstimate: false,
  })(survey)
  if (analysisNodeDefs.length === 0) return

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entityDef)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    await SurveyRdbManager.deleteNodeResultsByChainUuid({ survey, entity: entityDef, chain, cycle, chainUuid }, tx)

    // Insert node results
    const massiveUpdateData = new SurveyRdbManager.MassiveUpdateData({ survey, entityDef, analysisNodeDefs }, tx)
    const massiveUpdateNodes = new SurveyRdbManager.MassiveUpdateNodes({ surveyId, analysisNodeDefs }, tx)

    await CSVReader.createReaderFromStream(stream, null, async (row) => {
      await massiveUpdateData.push(row)
      await massiveUpdateNodes.push(row)
    }).start()

    await massiveUpdateData.flush()
    await massiveUpdateNodes.flush()
  })

  fileZip.close()
}

const getAnalysisNodeDefZipEntryName = ({ entity, nodeDef }) => {
  const nodeDefName = NodeDef.getName(nodeDef)

  if (NodeDef.isBaseUnit(nodeDef)) {
    return `base-unit-${nodeDefName}`
  }
  if (NodeDef.isSampling(nodeDef) && !NodeDef.isAreaBasedEstimatedOf(nodeDef)) {
    return nodeDefName.replace(`${NodeDef.getName(entity)}_`, `${NodeDef.getName(entity)}-`)
  }
  return `${NodeDef.getName(entity)}-${nodeDefName}`
}

export const persistUserScripts = async ({ user, surveyId, chainUuid, filePath }) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()

  const entryNames = fileZip.getEntryNames()

  const findEntry = ({ folderNames = [RChain.dirNames.user, RChain.dirNames.sampling], name }) =>
    entryNames.find((entryName) =>
      folderNames.some((folder) => new RegExp(`^${folder}\\/\\d{3}-${name}\\.R$`).test(entryName))
    )

  const getZipEntryAsText = (name) => fileZip.getEntryAsText(findEntry({ name }))?.trim()

  await db.tx(async (tx) => {
    // Persist common and end scripts
    const scriptCommon = getZipEntryAsText('common')
    const scriptEnd = getZipEntryAsText('common-end')

    await AnalysisManager.updateChain(
      {
        surveyId,
        chainUuid,
        fields: {
          [TableChain.columnSet.scriptCommon]: scriptCommon,
          [TableChain.columnSet.scriptEnd]: scriptEnd,
        },
      },
      tx
    )

    const [chain, survey] = await Promise.all([
      AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true }, tx),
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, advanced: true, draft: true }),
    ])

    const entities = Survey.getAnalysisEntities({ chain })(survey)

    await PromiseUtils.each(entities, async (entity) => {
      const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain, hideAreaBasedEstimate: false })(
        survey
      )

      if (analysisNodeDefsInEntity.length > 0) {
        await PromiseUtils.each(analysisNodeDefsInEntity, async (nodeDef) => {
          const nodeDefUuid = NodeDef.getUuid(nodeDef)
          const parentUuid = NodeDef.getParentUuid(nodeDef)

          const scriptEntryName = getAnalysisNodeDefZipEntryName({ entity, nodeDef })

          const script = getZipEntryAsText(scriptEntryName)

          await NodeDefManager.updateNodeDefProps(
            { user, survey, nodeDefUuid, parentUuid, propsAdvanced: { script } },
            tx
          )
        })
      }
    })
  })
}
