import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/chain'

import * as SurveyNodeDefs from './surveyNodeDefs'

import { getHierarchy, traverseHierarchyItemSync } from './surveyNodeDefs'

// ====== READ
export const getAnalysisNodeDefs =
  ({
    chain,
    entity,
    entityDefUuid,
    showSamplingNodeDefs = true,
    hideSamplingNodeDefsWithoutSibilings = true,
    hideAreaBasedEstimate = true,
    showInactiveResultVariables = false,
  }) =>
  (survey) => {
    const _nodeDefs = SurveyNodeDefs.getNodeDefsArray(survey)
    let nodeDefs = _nodeDefs.filter((nodeDef) => {
      if (!NodeDef.isAnalysis(nodeDef)) return false

      // remove nodeDefs not in this chain
      if (
        chain &&
        NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.chainUuid)(nodeDef) !== Chain.getUuid(chain)
      )
        return false

      // remove nodeDefs not in this entity
      if (entity && NodeDef.getParentUuid(nodeDef) !== NodeDef.getUuid(entity)) return false

      // remove nodeDefs not in this entity bu entityUuid
      if (entityDefUuid && NodeDef.getParentUuid(nodeDef) !== entityDefUuid) return false

      if (!showSamplingNodeDefs && NodeDef.isSampling(nodeDef)) return false

      if (hideAreaBasedEstimate && NodeDef.getAreaBasedEstimatedOf(nodeDef)) return false

      // show base unit nodeDefs with nodeDef analysis sibilings
      if (
        showSamplingNodeDefs &&
        hideSamplingNodeDefsWithoutSibilings &&
        NodeDef.isSampling(nodeDef) &&
        !NodeDef.isBaseUnit(nodeDef)
      ) {
        const hasAnalysisSibilings = _nodeDefs.some(
          (_nodeDef) =>
            NodeDef.isSampling(_nodeDef) &&
            NodeDef.getParentUuid(nodeDef) === NodeDef.getParentUuid(_nodeDef) &&
            NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(_nodeDef)
        )

        if (!hasAnalysisSibilings) return false
      }

      if (hideAreaBasedEstimate && NodeDef.isAreaBasedEstimatedOf(nodeDef)) {
        return false
      }

      if (!showInactiveResultVariables && !NodeDef.getActive(nodeDef)) {
        return false
      }

      if (
        NodeDef.isAreaBasedEstimatedOf(nodeDef) &&
        !showInactiveResultVariables &&
        !NodeDef.getActive(Survey.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey))
      ) {
        return false
      }

      return true
    })

    return nodeDefs.sort((nodeDefA, nodeDefB) => NodeDef.getChainIndex(nodeDefA) - NodeDef.getChainIndex(nodeDefB))
  }

export const getAnalysisEntities =
  ({ chain }) =>
  (survey) => {
    const { root } = getHierarchy()(survey)

    const entities = []
    if (getAnalysisNodeDefs({ entity: root, chain })(survey).length > 0) {
      entities.push(root)
    }
    traverseHierarchyItemSync(root, (nodeDef) => {
      if (
        NodeDef.isEntity(nodeDef) &&
        NodeDef.isMultipleEntity(nodeDef) &&
        getAnalysisNodeDefs({ entity: nodeDef, chain })(survey).length > 0
      ) {
        entities.push(nodeDef)
      }
    })

    return entities
  }

export const getBaseUnitNodeDef =
  ({ chain }) =>
  (survey) => {
    let baseUnitNodeDef = null

    const hierarchy = SurveyNodeDefs.getHierarchy()(survey)
    SurveyNodeDefs.traverseHierarchyItemSync(hierarchy.root, (visitedEntityDef) => {
      if (NodeDef.isRoot(visitedEntityDef) || NodeDef.isMultipleEntity(visitedEntityDef)) {
        const nodeDefs = getAnalysisNodeDefs({ chain, entityDefUuid: NodeDef.getUuid(visitedEntityDef) })(survey)
        const _baseUnitNodeDef = nodeDefs.find(NodeDef.isBaseUnit)
        if (!baseUnitNodeDef && _baseUnitNodeDef) {
          baseUnitNodeDef = SurveyNodeDefs.getNodeDefParent(_baseUnitNodeDef)(survey)
        }
      }
    })

    return baseUnitNodeDef
  }
