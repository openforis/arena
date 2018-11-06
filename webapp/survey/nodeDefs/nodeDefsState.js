import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'

// ====== UPDATE

export const assocNodeDef = nodeDef => R.assoc(nodeDef.uuid, nodeDef)

export const assocNodeDefProp = (nodeDefUUID, key, value) => R.pipe(
  R.assocPath([nodeDefUUID, 'props', key], value),
  R.dissocPath([nodeDefUUID, 'validation', 'fields', key]),
)

// ====== DELETE

export const dissocNodeDef = nodeDef =>
  nodeDefsState => {

    const state = NodeDef.isNodeDefEntity(nodeDef)
      ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        nodeDefsState,
        Survey.getNodeDefChildren(nodeDef)({nodeDefs: nodeDefsState})
      )
      : nodeDefsState

    return R.dissoc(nodeDef.uuid, state)
  }
