import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'

// ====== UPDATE

export const assocNodeDef = nodeDef => R.assoc(nodeDef.uuid, nodeDef)

export const assocNodeDefProp = (nodeDefUuid, key, value) => R.pipe(
  R.assocPath(R.concat([nodeDefUuid, 'props'], R.split('.', key)), value),
  R.assocPath([nodeDefUuid, NodeDef.keys.dirty], true),
  R.dissocPath([nodeDefUuid, 'validation', 'fields', key]), //TODO handle dissoc nested objects validation
)

export const assocNodeDefs = nodeDefs => nodeDefsState => {
  const dirtyDefs = R.filter(NodeDef.isNodeDefDirty, nodeDefsState)

  // ignore node defs currently being updated by the user
  // (marked as dirty and with 'props' different from the ones of the loaded node def)
  return R.filter(
    nodeDef => {
      const dirtyDef = R.prop(NodeDef.getUuid(nodeDef), dirtyDefs)
      return !dirtyDef ||
        NodeDef.isNodeDefRoot(nodeDef) || // TODO check if needed
        NodeDef.hasSameProps(dirtyDef)(nodeDef)
    },
    nodeDefs
  )
}

// ====== DELETE

export const dissocNodeDef = nodeDef =>
  nodeDefsState => {

    const state = NodeDef.isNodeDefEntity(nodeDef)
      ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        nodeDefsState,
        Survey.getNodeDefChildren(nodeDef)({ nodeDefs: nodeDefsState })
      )
      : nodeDefsState

    return R.dissoc(nodeDef.uuid, state)
  }
