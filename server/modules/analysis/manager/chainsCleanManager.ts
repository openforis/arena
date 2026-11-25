import type { ArenaAnyNodeDef, ArenaSurvey, ArenaUser } from '@openforis/arena-core'

import { AreaBasedEstimatedOfNodeDef } from '@common/analysis/areaBasedEstimatedNodeDef'
import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as DB from '@server/db'
import type { DbClient } from '@server/db/db'
import * as Log from '@server/log/log'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const Logger = Log.getLogger('ChainsCleanManager')

const _cleanChainsOrphans = async ({ user, surveyId }: { user: ArenaUser; surveyId: number }, tx: DbClient) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx)
  const chains = await ChainRepository.fetchChains({ surveyId }, tx)
  const chainsUuids = new Set(chains.map(Chain.getUuid))

  const orphanNodeDefsUuids = Survey.getNodeDefsArray(survey)
    .filter((_nodeDef) => NodeDef.getChainUuid(_nodeDef) && !chainsUuids.has(NodeDef.getChainUuid(_nodeDef)))
    .map(NodeDef.getUuid)

  Logger.info(`Deleting orphan node def uuids: ${orphanNodeDefsUuids}`)

  return NodeDefService.markNodeDefsDeleted({ user, surveyId, nodeDefUuids: orphanNodeDefsUuids }, tx)
}

const _fixUpdatedAreaBasedEstimatedOfNodeDef = (
  {
    user,
    survey,
    nodeDef,
    areaBasedEstimatedOfNodeDef,
  }: { user: ArenaUser; survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef; areaBasedEstimatedOfNodeDef: ArenaAnyNodeDef },
  tx: DbClient
) => {
  const nodeDefUpdated = AreaBasedEstimatedOfNodeDef.updateNodeDef({
    survey,
    nodeDefAreaBasedEstimate: nodeDef,
    areaBasedEstimatedOfNodeDef,
  })

  const oldName = NodeDef.getName(nodeDef)
  const newName = NodeDef.getName(nodeDefUpdated)

  Logger.info(`Fixing node def '${oldName}' with uuid '${NodeDef.getUuid(nodeDef)}'; new name: '${newName}'`)

  return NodeDefService.updateNodeDefProps(
    {
      user,
      surveyId: Survey.getId(survey),
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      parentUuid: NodeDef.getParentUuid(nodeDef),
      props: NodeDef.getProps(nodeDefUpdated),
      propsAdvanced: NodeDef.getPropsAdvanced(nodeDefUpdated),
    },
    tx
  )
}

const _fixUpdatedAreaBasedEstimatedOfNodeDefs = async (
  { user, surveyId }: { user: ArenaUser; surveyId: number },
  tx: DbClient
) => {
  const nodeDefsUpdated = {}
  const nodeDefsValidation = {}

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true, includeAnalysis: true },
    tx
  )

  for (const nodeDef of Survey.getNodeDefsArray(survey)) {
    const chainUuid = NodeDef.getChainUuid(nodeDef)
    if (chainUuid) {
      const areaBasedEstimatedOfNodeDef = Survey.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey)
      if (areaBasedEstimatedOfNodeDef) {
        const expectedName = AreaBasedEstimatedOfNodeDef.getName({ estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })
        if (NodeDef.getName(nodeDef) !== expectedName) {
          // ancestors node defs have been updated, so the name of this node def must be updated too
          const { nodeDefsUpdated: nodeDefsUpdatedTemp, nodeDefsValidation: nodeDefsValidationTemp } =
            /* NOSONAR */ await _fixUpdatedAreaBasedEstimatedOfNodeDef(
              { user, survey, nodeDef, areaBasedEstimatedOfNodeDef },
              tx
            )
          Object.assign(nodeDefsUpdated, nodeDefsUpdatedTemp)
          Object.assign(nodeDefsValidation, nodeDefsValidationTemp)
        }
      }
    }
  }
  return { nodeDefsUpdated, nodeDefsValidation }
}

export const cleanChains = ({ user, surveyId }: { user: ArenaUser; surveyId: number }, client: DbClient = DB.client) =>
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
