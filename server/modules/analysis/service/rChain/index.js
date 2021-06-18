import * as PromiseUtils from '@core/promiseUtils'
import { ChainNodeDefRepository } from '@server/modules/analysis/repository/chainNodeDef'

import { db } from '../../../../db/db'

import FileZip from '../../../../utils/file/fileZip'
import * as CSVReader from '../../../../utils/file/csvReader'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import { TableChain } from '../../../../../common/model/db'
import { Query } from '../../../../../common/model/query'

import * as SurveyManager from '../../../survey/manager/surveyManager'
import * as SurveyRdbManager from '../../../surveyRdb/manager/surveyRdbManager'
import * as AnalysisManager from '../../manager'

import { padStart } from './rFile'

import RChain from './rChain'

export const generateScript = async ({ surveyId, cycle, chainUuid, serverUrl }) =>
  new RChain(surveyId, cycle, chainUuid, serverUrl).init()

// ==== READ
export const fetchEntityData = async ({ surveyId, cycle, entityDefUuid }) => {
  const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const query = Query.create({ entityDefUuid })

  return SurveyRdbManager.fetchViewData({ survey: surveyAndNodeDefs, cycle, query, columnNodeDefs: true })
}

// ==== UPDATE

export const persistResults = async ({ surveyId, cycle, entityDefUuid, chainUuid, filePath }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  const chain = await AnalysisManager.fetchChain({
    surveyId,
    chainUuid,
    includeChainNodeDefs: true,
  })

  const entity = Survey.getNodeDefByUuid(entityDefUuid)(survey)

  const fileZip = new FileZip(filePath)
  await fileZip.init()
  const stream = await fileZip.getEntryStream(`${NodeDef.getName(entity)}.csv`)
  await db.tx(async (tx) => {
    // Reset node results
    await SurveyRdbManager.deleteNodeResultsByChainUuid({ survey, entity, chain, cycle, chainUuid }, tx)

    // Insert node results
    const massiveUpdateData = new SurveyRdbManager.MassiveUpdateData({ survey, entity, chain, chainUuid, cycle }, tx)

    const massiveUpdateNodes = new SurveyRdbManager.MassiveUpdateNodes(
      { survey, surveyId, entity, chain, chainUuid, cycle },
      tx
    )

    await CSVReader.createReaderFromStream(stream, null, (row) => {
      massiveUpdateData.push.bind(massiveUpdateData)(row)
      massiveUpdateNodes.push.bind(massiveUpdateNodes)(row)
    }).start()
    await massiveUpdateData.flush()
    await massiveUpdateNodes.flush()

    // Insert node results

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

    const [chain, survey] = await Promise.all([
      AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true }, tx),
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }),
    ])

    const { root } = Survey.getHierarchy()(survey)

    const entities = []
    Survey.traverseHierarchyItemSync(root, (nodeDef) => {
      if (NodeDef.isEntity(nodeDef)) {
        entities.push(nodeDef)
      }
    })

    await PromiseUtils.each(entities, async (entity, entityIndex) => {
      const AnalysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain })(survey)

      if (AnalysisNodeDefsInEntity.length > 0) {
        await PromiseUtils.each(AnalysisNodeDefsInEntity, async (nodeDef) => {
          const nodeDefName = NodeDef.getName(nodeDef)

          const entityFolder = `${RChain.dirNames.user}/${padStart(entityIndex + 1)}-${NodeDef.getName(entity)}`

          const script = (await fileZip.getEntryAsText(findEntry(entityFolder, nodeDefName)))?.trim()

          // TO UPDATE
          await ChainNodeDefRepository.updateScript({ surveyId, uuid: NodeDef.getUuid(nodeDef), newSript: script }, tx)
        })
      }
    })
  })
}
