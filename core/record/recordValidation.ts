import * as R from 'ramda';
import Validation from '../validation/validation';
import Node from './node';
import NodeDef from '../survey/nodeDef';

const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount',
  minCount: 'minCount',
  maxCount: 'maxCount',
}

const getValidationChildrenCount = (parentNode, childDef) => R.pipe(
  Validation.getFieldValidation(Node.getUuid(parentNode)),
  Validation.getFieldValidation(keys.childrenCount),
  Validation.getFieldValidation(NodeDef.getUuid(childDef))
)

const getNodeValidation = node =>
  R.pipe(
    Validation.getFieldValidation(Node.getUuid(node)),
    Validation.dissocFieldValidation(keys.childrenCount)
  )

export default {
  keys,

  // READ
  getNodeValidation,

  getValidationChildrenCount,
};
