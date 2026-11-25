import type { ArenaAnyNodeDef, ArenaChain, ArenaNodeDefEntity, ArenaSurvey } from '@openforis/arena-core'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyNodeDefs from './surveyNodeDefs'

// ====== READ
const isInChainAndEntity = ({
  nodeDef,
  chain,
  entity,
  entityDefUuid,
}: {
  nodeDef: ArenaAnyNodeDef
  chain?: ArenaChain | null
  entity?: ArenaAnyNodeDef | null
  entityDefUuid?: string | null
}): boolean => {
  if (chain && NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.chainUuid)(nodeDef) !== Chain.getUuid(chain))
    return false
  if (entity && NodeDef.getParentUuid(nodeDef) !== NodeDef.getUuid(entity)) return false
  return !entityDefUuid || NodeDef.getParentUuid(nodeDef) === entityDefUuid
}

const hasSamplingSiblings = ({
  nodeDef,
  nodeDefs,
}: {
  nodeDef: ArenaAnyNodeDef
  nodeDefs: ArenaAnyNodeDef[]
}): boolean =>
  nodeDefs.some(
    (_nodeDef) =>
      NodeDef.isSampling(_nodeDef) &&
      NodeDef.getParentUuid(nodeDef) === NodeDef.getParentUuid(_nodeDef) &&
      NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(_nodeDef)
  )

const isActiveResultVariable = ({ survey, nodeDef }: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef }): boolean =>
  NodeDef.isActive(nodeDef) &&
  (!NodeDef.isAreaBasedEstimatedOf(nodeDef) ||
    NodeDef.isActive(SurveyNodeDefs.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey)))

type AnalysisNodeDefsParams = {
  chain?: ArenaChain | null
  entity?: ArenaAnyNodeDef | null
  entityDefUuid?: string | null
  showSamplingNodeDefs?: boolean
  hideSamplingNodeDefsWithoutSiblings?: boolean
  hideAreaBasedEstimate?: boolean
  showInactiveResultVariables?: boolean
}

export const getAnalysisNodeDefs =
  ({
    chain,
    entity = null,
    entityDefUuid = null,
    showSamplingNodeDefs = true,
    hideSamplingNodeDefsWithoutSiblings = false,
    hideAreaBasedEstimate = true,
    showInactiveResultVariables = false,
  }: AnalysisNodeDefsParams) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const _nodeDefs = SurveyNodeDefs.getNodeDefsArray(survey)
    const nodeDefs = _nodeDefs.filter((nodeDef) => {
      if (!NodeDef.isAnalysis(nodeDef)) return false

      // remove nodeDefs not in this chain or entity
      if (!isInChainAndEntity({ nodeDef, chain, entity, entityDefUuid })) return false

      const isSampling = NodeDef.isSampling(nodeDef)

      if (!showSamplingNodeDefs && isSampling) return false

      if (hideAreaBasedEstimate && NodeDef.isAreaBasedEstimatedOf(nodeDef)) return false

      // show base unit nodeDefs with nodeDef analysis siblings
      if (
        showSamplingNodeDefs &&
        hideSamplingNodeDefsWithoutSiblings &&
        isSampling &&
        !NodeDef.isBaseUnit(nodeDef) &&
        !hasSamplingSiblings({ nodeDef, nodeDefs: _nodeDefs })
      ) {
        return false
      }

      return showInactiveResultVariables || isActiveResultVariable({ survey, nodeDef })
    })

    return nodeDefs.sort((nodeDefA, nodeDefB) => NodeDef.getChainIndex(nodeDefA) - NodeDef.getChainIndex(nodeDefB))
  }

export const getAnalysisEntities =
  ({ chain }: { chain: ArenaChain }) =>
  (survey: ArenaSurvey): ArenaNodeDefEntity[] => {
    const { root } = SurveyNodeDefs.getHierarchy()(survey)

    const clusteringNodeDefUuid = ChainSamplingDesign.getClusteringNodeDefUuid(Chain.getSamplingDesign(chain))

    const isAnalysisEntity = (nodeDef: ArenaAnyNodeDef): boolean =>
      (NodeDef.isRoot(nodeDef) || NodeDef.isMultipleEntity(nodeDef)) &&
      ((clusteringNodeDefUuid && NodeDef.getUuid(nodeDef) === clusteringNodeDefUuid) ||
        getAnalysisNodeDefs({ entity: nodeDef, chain })(survey).length > 0)

    const entities: ArenaNodeDefEntity[] = []
    SurveyNodeDefs.traverseHierarchyItemSync(root, (nodeDef) => {
      if (isAnalysisEntity(nodeDef)) {
        entities.push(nodeDef as ArenaNodeDefEntity)
      }
    })
    return entities
  }

export const getBaseUnitNodeDef =
  ({ chain }: { chain: ArenaChain }) =>
  (survey: ArenaSurvey): ArenaNodeDefEntity | null => {
    const samplingDesign = Chain.getSamplingDesign(chain)
    const baseUnitNodeDefUuid = ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesign)
    // the base unit is an entity
    return SurveyNodeDefs.getNodeDefByUuid(baseUnitNodeDefUuid)(survey) as ArenaNodeDefEntity | null
  }

export const getSamplingNodeDefChild =
  ({ nodeDefParent, chainUuid }: { nodeDefParent: ArenaNodeDefEntity; chainUuid: string }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef | undefined =>
    SurveyNodeDefs.getNodeDefChildren({ nodeDef: nodeDefParent })(survey).find(
      (nodeDefChild) =>
        NodeDef.isSampling(nodeDefChild) &&
        NodeDef.getChainUuid(nodeDefChild) === chainUuid &&
        !NodeDef.isDeleted(nodeDefChild)
    )

/**
 * Returns the available reporting data node defs
 * (code attribute definitions belonging to the base unit or its ancestors).
 * @returns Function returning the available reporting data node defs of the specified survey.
 */
export const getAvailableReportingDataNodeDefs =
  ({ chain }: { chain: ArenaChain }) =>
  (survey: ArenaSurvey): ArenaAnyNodeDef[] => {
    const baseUnitNodeDef = getBaseUnitNodeDef({ chain })(survey)

    const availableReportingDataNodeDefs: ArenaAnyNodeDef[] = []
    if (baseUnitNodeDef) {
      SurveyNodeDefs.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDefAncestor) => {
        const descendantAttributes = SurveyNodeDefs.getNodeDefDescendantAttributesInSingleEntities({
          nodeDef: nodeDefAncestor,
          includeAnalysis: true,
        })(survey)
        for (const nodeDef of descendantAttributes) {
          if (NodeDef.isSingleAttribute(nodeDef) && NodeDef.isCode(nodeDef)) {
            availableReportingDataNodeDefs.push(nodeDef)
          }
        }
      })(survey)
    }
    return availableReportingDataNodeDefs
  }
