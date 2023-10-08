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

const updateNodeDefAreaBasedEstimate = async ({ survey, nodeDef }, client = db) => {
  const nodeDefAreaBasedEstimate = Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
  if (!nodeDefAreaBasedEstimate) {
    return null
  }
  const surveyId = Survey.getId(survey)
  const chainUuid = NodeDef.getChainUuid(nodeDefAreaBasedEstimate)
  const chain = await ChainRepository.fetchChain({ surveyId, chainUuid }, client)

  let nodeDefAreaBasedEstimateUpdated = AreaBasedEstimatedOfNodeDef.updateNodeDef({
    survey,
    chain,
    nodeDefAreaBasedEstimate,
    areaBasedEstimatedOfNodeDef: nodeDef,
  })
  nodeDefAreaBasedEstimateUpdated = await NodeDefRepository.updateNodeDefProps(
    {
      surveyId,
      nodeDefUuid: NodeDef.getUuid(nodeDefAreaBasedEstimate),
      parentUuid: NodeDef.getParentUuid(nodeDefAreaBasedEstimate),
      props: NodeDef.getProps(nodeDefAreaBasedEstimateUpdated),
      propsAdvanced: NodeDef.getPropsAdvanced(nodeDefAreaBasedEstimateUpdated),
    },
    client
  )
  return nodeDefAreaBasedEstimateUpdated
}

const insertOrDeleteNodeDefAreaBasedEstimate = async ({ survey, nodeDef }, client = db) => {
  const chainUuid = NodeDef.getChainUuid(nodeDef)
  if (NodeDef.hasAreaBasedEstimated(nodeDef)) {
    // insert new area based estimate node def
    return insertNodeDefAreaBasedEstimate({ survey, chainUuid, estimatedOfNodeDef: nodeDef }, client)
  } else {
    // delete existing area based estimate node def
    const nodeDefAreaBasedEstimate = Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
    if (!nodeDefAreaBasedEstimate) {
      return null
    }
    const surveyId = Survey.getId(survey)
    await NodeDefRepository.markNodeDefDeleted(surveyId, NodeDef.getUuid(nodeDefAreaBasedEstimate), client)
    return NodeDef.assocDeleted(true)(nodeDefAreaBasedEstimate)
  }
}

export const NodeDefAreaBasedEstimateManager = {
  insertNodeDefAreaBasedEstimate,
  updateNodeDefAreaBasedEstimate,
  insertOrDeleteNodeDefAreaBasedEstimate,
}
