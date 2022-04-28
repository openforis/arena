import * as Chain from '@common/analysis/chain'
import { AreaBasedEstimatedOfNodeDef } from '@common/analysis/areaBasedEstimatedNodeDef'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as PromiseUtils from '@core/promiseUtils'

import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'
import * as Log from '@server/log/log'

import * as DB from '@server/db'

const Logger = Log.getLogger('ChainsCleanManager')

const _cleanChainsOrphans = async ({ user, surveyId }, tx) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx)
  const chains = await ChainRepository.fetchChains({ surveyId }, tx)
  const chainsUuids = chains.map(Chain.getUuid)

  const orphanNodeDefsUuids = Survey.getNodeDefsArray(survey)
    .filter((_nodeDef) => NodeDef.getChainUuid(_nodeDef) && !chainsUuids.includes(NodeDef.getChainUuid(_nodeDef)))
    .map(NodeDef.getUuid)

  Logger.info(`Deleting orphan node def uuids: ${orphanNodeDefsUuids}`)

  return NodeDefService.markNodeDefsDeleted({ user, surveyId, nodeDefUuids: orphanNodeDefsUuids }, tx)
}

const _fixUpdatedAreaBasedEstimatedOfNodeDef = async (
  { user, survey, chain, nodeDef, areaBasedEstimatedOfNodeDef },
  tx
) => {
  const surveyId = Survey.getId(survey)

  const name = AreaBasedEstimatedOfNodeDef.getName({ estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })
  const script = AreaBasedEstimatedOfNodeDef.getScript({
    survey,
    chain,
    estimatedOfNodeDef: areaBasedEstimatedOfNodeDef,
  })

  Logger.info(
    `Fixing node def '${NodeDef.getName(nodeDef)}' with uuid '${NodeDef.getUuid(nodeDef)}'; new name: '${name}'`
  )

  return NodeDefService.updateNodeDefProps(
    {
      user,
      surveyId,
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      parentUuid: NodeDef.getParentUuid(nodeDef),
      props: {
        [NodeDef.propKeys.name]: name,
      },
      propsAdvanced: {
        [NodeDef.keysPropsAdvanced.script]: script,
      },
    },
    tx
  )
}

const _fixUpdatedAreaBasedEstimatedOfNodeDefs = async ({ user, surveyId }, tx) => {
  const nodeDefsUpdated = {}
  const nodeDefsValidation = {}

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true, includeAnalysis: true },
    tx
  )
  const chains = await ChainRepository.fetchChains({ surveyId }, tx)

  await PromiseUtils.each(Survey.getNodeDefsArray(survey), async (nodeDef) => {
    const chainUuid = NodeDef.getChainUuid(nodeDef)
    if (chainUuid) {
      const areaBasedEstimatedOfNodeDef = Survey.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey)
      if (areaBasedEstimatedOfNodeDef) {
        const expectedName = AreaBasedEstimatedOfNodeDef.getName({
          estimatedOfNodeDef: areaBasedEstimatedOfNodeDef,
        })
        if (NodeDef.getName(nodeDef) !== expectedName) {
          // ancestors node defs have been updated, so the name of this node def must be updated too
          const chain = chains.find((_chain) => Chain.getUuid(_chain) === chainUuid)
          const { nodeDefsUpdated: nodeDefsUpdatedTemp, nodeDefsValidation: nodeDefsValidationTemp } =
            await _fixUpdatedAreaBasedEstimatedOfNodeDef(
              { user, survey, chain, nodeDef, areaBasedEstimatedOfNodeDef },
              tx
            )
          Object.assign(nodeDefsUpdated, nodeDefsUpdatedTemp)
          Object.assign(nodeDefsValidation, nodeDefsValidationTemp)
        }
      }
    }
  })
  return { nodeDefsUpdated, nodeDefsValidation }
}

export const cleanChains = async ({ user, surveyId }, client = DB.client) =>
  client.tx(async (tx) => {
    const nodeDefsUpdated = {}
    const nodeDefsValidation = {}

    const { nodeDefsUpdated: nodeDefsUpdatedOrphans, nodeDefsValidation: nodeDefsValidationOrphans } =
      await _cleanChainsOrphans({ user, surveyId }, tx)
    Object.assign(nodeDefsUpdated, nodeDefsUpdatedOrphans)
    Object.assign(nodeDefsValidation, nodeDefsValidationOrphans)

    const {
      nodeDefsUpdated: nodeDefsUpdatedAreaBasedEstimatedOf,
      nodeDefsValidation: nodeDefsValidationAreaBasedEstimatedOf,
    } = await _fixUpdatedAreaBasedEstimatedOfNodeDefs({ user, surveyId }, tx)
    Object.assign(nodeDefsUpdated, nodeDefsUpdatedAreaBasedEstimatedOf)
    Object.assign(nodeDefsValidation, nodeDefsValidationAreaBasedEstimatedOf)

    return { nodeDefsUpdated, nodeDefsValidation }
  })
