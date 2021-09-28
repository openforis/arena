import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import * as SurveyNodeDefs from './surveyNodeDefs'

import { getHierarchy, traverseHierarchyItemSync } from './surveyNodeDefs'

// ====== READ
export const getAnalysisNodeDefs =
  ({ chain, entity, entityDefUuid }) =>
  (survey) => {
    let nodeDefs = SurveyNodeDefs.getNodeDefsArray(survey).filter(NodeDef.isAnalysis)

    if (chain) {
      nodeDefs = nodeDefs.filter((nodeDef) => {
        return NodeDef.getPropOrDraftAdvanced(NodeDef.keysPropsAdvanced.chainUuid)(nodeDef) === Chain.getUuid(chain)
      })
    }

    if (entity) {
      nodeDefs = nodeDefs.filter((nodeDef) => NodeDef.getParentUuid(nodeDef) === NodeDef.getUuid(entity))
    }
    if (entityDefUuid) {
      nodeDefs = nodeDefs.filter((nodeDef) => NodeDef.getParentUuid(nodeDef) === entityDefUuid)
    }

    return nodeDefs.sort((nodeDefA, nodeDefB) => NodeDef.getChainIndex(nodeDefA) - NodeDef.getChainIndex(nodeDefB))
  }

export const getAnalysisEntities =
  ({ chain }) =>
  (survey) => {
    const { root } = getHierarchy()(survey)

    const entities = []
    entities.push(root)
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
