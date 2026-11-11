import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as SurveyNodeDefs from './surveyNodeDefs'

import { getHierarchy, traverseHierarchyItemSync } from './surveyNodeDefs'

// ====== READ
const isInChainAndEntity = ({ nodeDef, chain, entity, entityDefUuid }) => {
  if (chain && NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.chainUuid)(nodeDef) !== Chain.getUuid(chain))
    return false
  if (entity && NodeDef.getParentUuid(nodeDef) !== NodeDef.getUuid(entity)) return false
  return !entityDefUuid || NodeDef.getParentUuid(nodeDef) === entityDefUuid
}

const hasSamplingSiblings = ({ nodeDef, nodeDefs }) =>
  nodeDefs.some(
    (_nodeDef) =>
      NodeDef.isSampling(_nodeDef) &&
      NodeDef.getParentUuid(nodeDef) === NodeDef.getParentUuid(_nodeDef) &&
      NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(_nodeDef)
  )

const isActiveResultVariable = ({ survey, nodeDef }) =>
  NodeDef.isActive(nodeDef) &&
  (!NodeDef.isAreaBasedEstimatedOf(nodeDef) || NodeDef.isActive(Survey.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey)))

export const getAnalysisNodeDefs =
  ({
    chain,
    entity = null,
    entityDefUuid = null,
    showSamplingNodeDefs = true,
    hideSamplingNodeDefsWithoutSiblings = false,
    hideAreaBasedEstimate = true,
    showInactiveResultVariables = false,
  }) =>
  (survey) => {
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
  ({ chain }) =>
  (survey) => {
    const { root } = getHierarchy()(survey)

    const clusteringNodeDefUuid = A.pipe(Chain.getSamplingDesign, ChainSamplingDesign.getClusteringNodeDefUuid)(chain)

    const entities = []
    traverseHierarchyItemSync(root, (nodeDef) => {
      if (
        (NodeDef.isRoot(nodeDef) || NodeDef.isMultipleEntity(nodeDef)) &&
        ((clusteringNodeDefUuid && NodeDef.getUuid(nodeDef) === clusteringNodeDefUuid) ||
          getAnalysisNodeDefs({ entity: nodeDef, chain })(survey).length > 0)
      ) {
        entities.push(nodeDef)
      }
    })
    return entities
  }

export const getBaseUnitNodeDef =
  ({ chain }) =>
  (survey) => {
    const samplingDesign = Chain.getSamplingDesign(chain)
    const baseUnitNodeDefUuid = ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesign)
    return SurveyNodeDefs.getNodeDefByUuid(baseUnitNodeDefUuid)(survey)
  }

export const getSamplingNodeDefChild =
  ({ nodeDefParent, chainUuid }) =>
  (survey) =>
    SurveyNodeDefs.getNodeDefChildren({ nodeDef: nodeDefParent })(survey).find(
      (nodeDefChild) =>
        NodeDef.isSampling(nodeDefChild) &&
        NodeDef.getChainUuid(nodeDefChild) === chainUuid &&
        !NodeDef.isDeleted(nodeDefChild)
    )

/**
 * Returns the availble reporting data node defs
 * (code attribute definitions belonging to the base unit or its ancestors).
 * @param {!object} param - The parameters.
 * @param {!object} [param.chain] - The chain parameter.
 * @returns {NodeDef[]} - List of available reporting data node defs.
 */
export const getAvailableReportingDataNodeDefs =
  ({ chain }) =>
  (survey) => {
    const baseUnitNodeDef = getBaseUnitNodeDef({ chain })(survey)

    const availableReportingDataNodeDefs = []
    if (baseUnitNodeDef) {
      SurveyNodeDefs.visitAncestorsAndSelf(baseUnitNodeDef, (nodeDefAncestor) => {
        SurveyNodeDefs.getNodeDefDescendantAttributesInSingleEntities({
          nodeDef: nodeDefAncestor,
          includeAnalysis: true,
        })(survey).forEach((nodeDef) => {
          if (NodeDef.isSingleAttribute(nodeDef) && NodeDef.isCode(nodeDef)) {
            availableReportingDataNodeDefs.push(nodeDef)
          }
        })
      })(survey)
    }
    return availableReportingDataNodeDefs
  }
