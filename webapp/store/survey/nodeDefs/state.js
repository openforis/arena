import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'

export const stateKey = 'nodeDefs'

// ====== UPDATE

export const assocNodeDef = (nodeDef, dirty = false) => A.assoc(NodeDef.getUuid(nodeDef), { ...nodeDef, dirty })

export const mergeNodeDefs = A.mergeLeft

// ====== DELETE

export const dissocNodeDef = (nodeDef) => (nodeDefsState) => {
  // Delete the given node def from state
  let stateUpdated = A.dissoc(NodeDef.getUuid(nodeDef), nodeDefsState)

  // Delete descendant node defs from state
  Object.values(stateUpdated).forEach((nodeDefCurrent) => {
    if (NodeDef.isDescendantOf(nodeDef)(nodeDefCurrent)) {
      stateUpdated = A.dissoc(NodeDef.getUuid(nodeDefCurrent), stateUpdated)
    }
  })

  return stateUpdated
}

export const dissocNodeDefs = (nodeDefUuids) => (state) =>
  A.reduce((accState, nodeDefUuid) => A.dissoc(nodeDefUuid, accState), state, nodeDefUuids)
