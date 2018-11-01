import * as R from 'ramda'

import { getNodeDefChildren } from '../../../common/survey/survey'
import { isNodeDefEntity } from '../../../common/survey/nodeDef'

const nodeDefs = 'nodeDefs'

/**
 * ======
 * UPDATE
 * ======
 */

export const assocNodeDef = nodeDef => R.assoc(nodeDef.uuid, nodeDef)

export const assocNodeDefProp = (nodeDefUUID, key, value) => R.pipe(
  R.assocPath([nodeDefUUID, 'props', key], value),
  R.dissocPath([nodeDefUUID, 'validation', 'fields', key]),
)

/**
 * ======
 * DELETE
 * ======
 */
export const dissocNodeDef = nodeDef =>
  nodeDefsState => {
    const survey = {nodeDefs: R.dissoc(nodeDef.uuid, nodeDefsState)}

    const updatedSurvey = isNodeDefEntity(nodeDef)
      ? R.reduce(
        (s, n) => dissocNodeDef(n)(s),
        survey,
        getNodeDefChildren(nodeDef)(survey)
      )
      : survey

    return R.prop(nodeDefs)(updatedSurvey)
  }
