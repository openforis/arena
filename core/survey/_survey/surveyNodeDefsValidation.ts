import * as R from 'ramda';
import NodeDef from '../nodeDef';
import Validation from '../../validation/validation';

const keys = {
  nodeDefsValidation: 'nodeDefsValidation'
}

const getNodeDefsValidation = R.propOr({}, keys.nodeDefsValidation)

const assocNodeDefsValidation = R.assoc(keys.nodeDefsValidation)

const getNodeDefValidation = nodeDef => R.pipe(
  getNodeDefsValidation,
  Validation.getFieldValidation(NodeDef.getUuid(nodeDef))
)

export default {
  getNodeDefsValidation,
  assocNodeDefsValidation,
  getNodeDefValidation,
};
