import type { ArenaAnyNodeDef, ArenaNodeDefMap } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'

export const stateKey = 'nodeDefs'

// ====== UPDATE

export const assocNodeDef = (nodeDef, dirty = false) => A.assoc(NodeDef.getUuid(nodeDef), { ...nodeDef, dirty })

export const mergeNodeDefs = A.mergeLeft

// ====== DELETE

export const dissocNodeDef = (nodeDef: ArenaAnyNodeDef) => (nodeDefsState: ArenaNodeDefMap) => {
  // Delete the given node def from state
  let stateUpdated: ArenaNodeDefMap = A.dissoc(NodeDef.getUuid(nodeDef), nodeDefsState)

  // Delete descendant node defs from state
  for (const nodeDefCurrent of Object.values(stateUpdated)) {
    if (NodeDef.isDescendantOf(nodeDef)(nodeDefCurrent)) {
      stateUpdated = A.dissoc(NodeDef.getUuid(nodeDefCurrent), stateUpdated)
    }
  }

  return stateUpdated
}

export const dissocNodeDefs = (nodeDefUuids) => (state) =>
  A.reduce((accState, nodeDefUuid) => A.dissoc(nodeDefUuid, accState), state, nodeDefUuids)
