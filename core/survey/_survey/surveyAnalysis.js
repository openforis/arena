import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import * as SurveyNodeDefs from './surveyNodeDefs'

import { getHierarchy, traverseHierarchyItemSync } from './surveyNodeDefs'

// ====== READ
export const getAnalysisNodeDefs =
  ({ chain, entity, entityDefUuid, showBaseUnit = true }) =>
  (survey) => {
    let nodeDefs = SurveyNodeDefs.getNodeDefsArray(survey).filter(NodeDef.isAnalysis)

    // nedeDefs in this entity by chain
    if (chain) {
      nodeDefs = nodeDefs.filter(
        (nodeDef) =>
          NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.chainUuid)(nodeDef) === Chain.getUuid(chain)
      )
    }

    // nedeDefs in this entity
    if (entity) {
      nodeDefs = nodeDefs.filter((nodeDef) => NodeDef.getParentUuid(nodeDef) === NodeDef.getUuid(entity))
    }

    // nedeDefs in this entity by entityUuid
    if (entityDefUuid) {
      nodeDefs = nodeDefs.filter((nodeDef) => NodeDef.getParentUuid(nodeDef) === entityDefUuid)
    }

    nodeDefs = nodeDefs.filter((_nodeDef) => showBaseUnit || !NodeDef.isBaseUnit(_nodeDef))

    // show base unit nodeDefs with nodeDef analysis sibilings
    if (showBaseUnit) {
      nodeDefs = nodeDefs.filter((nodeDef) => {
        if (NodeDef.isBaseUnit(nodeDef)) {
          const hasAnalysisSibilings = nodeDefs.some(
            (_nodeDef) =>
              NodeDef.getParentUuid(nodeDef) === NodeDef.getParentUuid(_nodeDef) &&
              NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(_nodeDef)
          )
          return hasAnalysisSibilings
        }
        return true
      })
    }

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
