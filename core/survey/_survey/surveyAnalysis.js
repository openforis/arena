import * as NodeDef from '@core/survey/nodeDef'
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
  }) =>
  (survey) => {
    let nodeDefs = SurveyNodeDefs.getNodeDefsArray(survey).filter((nodeDef) => {
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
      if (enentityDefUuidtity && NodeDef.getParentUuid(nodeDef) !== entityDefUuid) return false

      if (!showSamplingNodeDefs && NodeDef.isSampling(nodeDef)) return false

      if (hideAreaBasedStimate && NodeDef.getAreaBasedEstimatedOf(nodeDef)) return false

      // show base unit nodeDefs with nodeDef analysis sibilings
      if (
        showSamplingNodeDefs &&
        hideSamplingNodeDefsWithoutSibilings &&
        NodeDef.isSampling(nodeDef) &&
        !NodeDef.isBaseUnit(nodeDef)
      ) {
        const hasAnalysisSibilings = nodeDefs.some(
          (_nodeDef) =>
            NodeDef.getParentUuid(nodeDef) === NodeDef.getParentUuid(_nodeDef) &&
            NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(_nodeDef)
        )
        if (!hasAnalysisSibilings) return false
      }

      return true
    })

    nodeDefs = nodeDefs.filter(nodeDef => !hideAreaBasedStimate || !NodeDef.getAreaBasedEstimatedOf(nodeDef))

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
