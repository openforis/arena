import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

// ====== UPDATE

export const assocNodeDef = nodeDef => R.assoc(NodeDef.getUuid(nodeDef), nodeDef)

export const mergeNodeDefs = R.mergeLeft

// ====== DELETE

export const dissocNodeDef = nodeDef => nodeDefsState => {
  const state = NodeDef.isEntity(nodeDef)
    ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        nodeDefsState,
        Survey.getNodeDefChildren(nodeDef)({ nodeDefs: nodeDefsState }),
      )
    : nodeDefsState

  return R.dissoc(NodeDef.getUuid(nodeDef), state)
}

export const dissocNodeDefs = nodeDefUuids => state =>
  R.reduce((accState, nodeDefUuid) => R.dissoc(nodeDefUuid, accState), state, nodeDefUuids)
