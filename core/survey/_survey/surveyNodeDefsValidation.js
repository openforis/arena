import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '../nodeDef'

const keys = {
  nodeDefsValidation: 'nodeDefsValidation',
}

export const getNodeDefsValidation = A.propOr({}, keys.nodeDefsValidation)

export const assocNodeDefsValidation = A.assoc(keys.nodeDefsValidation)

export const getNodeDefValidation = (nodeDef) =>
  A.pipe(getNodeDefsValidation, Validation.getFieldValidation(NodeDef.getUuid(nodeDef)))
