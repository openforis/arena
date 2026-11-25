import type { ArenaAnyNodeDef, ArenaSurvey } from '@openforis/arena-core'

import { AreaBasedEstimatedOfNodeDef } from '@common/analysis/areaBasedEstimatedNodeDef'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { db, DbClient } from '@server/db/db'
import * as NodeDefRepository from '../repository/nodeDefRepository'

const insertNodeDefAreaBasedEstimate = (
  {
    survey,
    chainUuid,
    estimatedOfNodeDef,
  }: { survey: ArenaSurvey; chainUuid: string; estimatedOfNodeDef: ArenaAnyNodeDef },
  client: DbClient = db
) => {
  const nodeDef = AreaBasedEstimatedOfNodeDef.newNodeDef({
    survey,
    chainUuid,
    estimatedOfNodeDef,
  })
  const surveyId = Survey.getId(survey)
  return NodeDefRepository.insertNodeDef(surveyId, nodeDef, client)
}

const updateNodeDefAreaBasedEstimate = async (
  { survey, nodeDef }: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef },
  client: DbClient = db
) => {
  const nodeDefAreaBasedEstimate = Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
  if (!nodeDefAreaBasedEstimate) {
    return null
  }
  const surveyId = Survey.getId(survey)

  let nodeDefAreaBasedEstimateUpdated = AreaBasedEstimatedOfNodeDef.updateNodeDef({
    survey,
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

const insertOrDeleteNodeDefAreaBasedEstimate = async (
  { survey, nodeDef }: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef },
  client: DbClient = db
) => {
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
