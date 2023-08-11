import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefRepository from '../repository/nodeDefRepository'
import { AreaBasedEstimatedOfNodeDef } from '@common/analysis/areaBasedEstimatedNodeDef'
import * as ChainRepository from '@server/modules/analysis/repository/chain'

const insertNodeDefAreaBasedEstimate = async ({ survey, chainUuid, estimatedOfNodeDef }, client = db) => {
  const nodeDef = AreaBasedEstimatedOfNodeDef.newNodeDef({
    survey,
    chainUuid,
    estimatedOfNodeDef,
  })
  const surveyId = Survey.getId(survey)
  return NodeDefRepository.insertNodeDef(surveyId, nodeDef, client)
}

const updateNodeDefAreaBasedEstimate = async (
  { survey, nodeDefAreaBasedEstimate, areaBasedEstimatedOfNodeDef },
  client = db
) => {
  const surveyId = Survey.getId(survey)
  const chainUuid = NodeDef.getChainUuid(nodeDefAreaBasedEstimate)
  const chain = await ChainRepository.fetchChain({ surveyId, chainUuid }, client)

  let nodeDefAreaBasedEstimateUpdated = AreaBasedEstimatedOfNodeDef.updateNodeDef({
    survey,
    chain,
    nodeDefAreaBasedEstimate,
    areaBasedEstimatedOfNodeDef,
  })
  nodeDefAreaBasedEstimateUpdated = await NodeDefRepository.updateNodeDefProps(
    surveyId,
    NodeDef.getUuid(nodeDefAreaBasedEstimate),
    NodeDef.getParentUuid(nodeDefAreaBasedEstimate),
    NodeDef.getProps(nodeDefAreaBasedEstimateUpdated),
    NodeDef.getPropsAdvanced(nodeDefAreaBasedEstimateUpdated),
    client
  )
  return nodeDefAreaBasedEstimateUpdated
}

export const NodeDefAreaBasedEstimateManager = {
  insertNodeDefAreaBasedEstimate,
  updateNodeDefAreaBasedEstimate,
}
