import * as R from 'ramda'

import * as NodeDef from '../nodeDef'
import * as Validation from '@core/validation/validation'

const keys = {
  nodeDefsValidation: 'nodeDefsValidation'
}

export const getNodeDefsValidation = R.propOr({}, keys.nodeDefsValidation)

export const assocNodeDefsValidation = R.assoc(keys.nodeDefsValidation)

export const getNodeDefValidation = nodeDef => R.pipe(
  getNodeDefsValidation,
  Validation.getFieldValidation(NodeDef.getUuid(nodeDef))
)
