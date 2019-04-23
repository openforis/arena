import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'

// ====== UPDATE

export const assocNodeDef = nodeDef => R.assoc(NodeDef.getUuid(nodeDef), nodeDef)

const assocNodeDefProp = (nodeDefUuid, key, value) => R.pipe(
  R.assocPath(R.concat([nodeDefUuid, 'props'], R.split('.', key)), value),
  R.dissocPath([nodeDefUuid, 'validation', 'fields', key]),
)

export const assocNodeDefProps = (nodeDefUuid, props, propsAdvanced) => state => {
  const allProps = R.merge(props, propsAdvanced)
  return R.reduce(
    (acc, key) => assocNodeDefProp(nodeDefUuid, key, R.prop(key, allProps))(acc),
    state,
    R.keys(allProps)
  )
}
// ====== DELETE

export const dissocNodeDef = nodeDef =>
  nodeDefsState => {

    const state = NodeDef.isEntity(nodeDef)
      ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        nodeDefsState,
        Survey.getNodeDefChildren(nodeDef)({ nodeDefs: nodeDefsState })
      )
      : nodeDefsState

    return R.dissoc(NodeDef.getUuid(nodeDef), state)
  }
