import * as PromiseUtils from '@core/promiseUtils'

import { db } from '../../../../db/db'

import FileZip from '../../../../utils/file/fileZip'
import * as CSVReader from '../../../../utils/file/csvReader'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import { TableChain } from '../../../../../common/model/db'
import { Query } from '../../../../../common/model/query'

import * as SurveyManager from '../../../survey/manager/surveyManager'
import * as NodeDefManager from '../../../nodeDef/manager/nodeDefManager'
import * as SurveyRdbManager from '../../../surveyRdb/manager/surveyRdbManager'
import * as AnalysisManager from '../../manager'

import RChain from './rChain'

export const generateScript = async ({ surveyId, cycle, chainUuid, serverUrl }) =>
  new RChain(surveyId, cycle, chainUuid, serverUrl).init()

// ==== READ
export const fetchNodeData = async ({ surveyId, cycle, nodeDefUuid, draft = true }) => {
  const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle,
    advanced: true,
    draft,
    includeAnalysis: false,
  })

  const query = Query.create({ entityDefUuid: nodeDefUuid })

  return SurveyRdbManager.fetchViewData({
    survey: surveyAndNodeDefs,
    cycle,
    query,
    columnNodeDefs: true,
    includeFileAttributeDefs: false,
  })
}

// ==== UPDATE

const _hasAnalysisNodeDefs = ({ survey, entity }) => {
  const analysisNodeDefs = Survey.getNodeDefDescendantAttributesInSingleEntities(
    entity,
    true
  )(survey).filter(NodeDef.isAnalysis)
  return analysisNodeDefs.length > 0
}

export const persistResults = async ({ surveyId, cycle, entityDefUuid, chainUuid, filePath }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, advanced: true, draft: true })
  const chain = await AnalysisManager.fetchChain({
    surveyId,
    chainUuid,
  })

  const entity = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entity)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    await SurveyRdbManager.deleteNodeResultsByChainUuid({ survey, entity, chain, cycle, chainUuid }, tx)

    // Insert node results
    const hasAnalysisNodeDefs = _hasAnalysisNodeDefs({ survey, entity })

    const massiveUpdateData = hasAnalysisNodeDefs
      ? new SurveyRdbManager.MassiveUpdateData({ survey, entity, cycle }, tx)
      : null
    const massiveUpdateNodes = new SurveyRdbManager.MassiveUpdateNodes(
      { survey, surveyId, entity, chain, chainUuid, cycle },
      tx
    )

    await CSVReader.createReaderFromStream(stream, null, async (row) => {
      if (massiveUpdateData) {
        await massiveUpdateData.push(row)
      }
      await massiveUpdateNodes.push(row)
    }).start()

    if (hasAnalysisNodeDefs) {
      await massiveUpdateData.flush()
    }
    await massiveUpdateNodes.flush()
  })

  fileZip.close()
}

export const persistUserScripts = async ({ user, surveyId, chainUuid, filePath }) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()

  const entryNames = fileZip.getEntryNames()

  const findEntry = ({ folderNames = [RChain.dirNames.user, RChain.dirNames.sampling], name }) =>
    entryNames.find((entryName) =>
      folderNames.some((folder) => new RegExp(`^${folder}\\/\\d{3}-${name}\\.R$`).test(entryName))
    )

  await db.tx(async (tx) => {
    // Persist common script
    let scriptCommon = (await fileZip.getEntryAsText(findEntry({ name: 'common' })))?.trim()

    if (scriptCommon) {
      await AnalysisManager.updateChain(
        { surveyId, chainUuid, fields: { [TableChain.columnSet.scriptCommon]: scriptCommon } },
        tx
      )
    }

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
          const nodeDefName = NodeDef.getName(nodeDef)
          const parentUuid = NodeDef.getParentUuid(nodeDef)

          let name = `${NodeDef.getName(entity)}-${nodeDefName}`
          if (NodeDef.isBaseUnit(nodeDef)) {
            name = `base-unit-${nodeDefName}`
          }
          if (NodeDef.isSampling(nodeDef) && !NodeDef.isAreaBasedEstimatedOf(nodeDef) && !NodeDef.isBaseUnit(nodeDef)) {
            name = nodeDefName.replace(`${NodeDef.getName(entity)}_`, `${NodeDef.getName(entity)}-`)
          }

          const script = (await fileZip.getEntryAsText(findEntry({ name })))?.trim()

          if (script) {
            await NodeDefManager.updateNodeDefProps(
              { user, survey, nodeDefUuid, parentUuid, propsAdvanced: { script } },
              tx
            )
          }
        })
      }
    })
  })
}
