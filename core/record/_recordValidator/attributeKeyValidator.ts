import * as R from 'ramda';
import Survey from '../../survey/survey';
import NodeDef from '../../survey/nodeDef';
import Record from '../record';
import Node from '../node';
import Validation from '../../validation/validation';

const validateAttributeKey = (survey, record, attributeDef) => async (propName, node) => {
  const nodeDefParent = Survey.getNodeDefParent(attributeDef)(survey)
  if (!NodeDef.isRoot(nodeDefParent) && NodeDef.isKey(attributeDef)) {
    const entity = Record.getParentNode(node)(record)
    if (_isEntityDuplicate(survey, record, entity)) {
      return { key: Validation.messageKeys.record.entityKeyDuplicate }
    }
  }
  return null
}

const _isEntityDuplicate = (survey, record, entity) => {
  // 1. get sibling entities
  const parentNode = Record.getParentNode(entity)(record)
  const siblingEntitiesAndSelf = Record.getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(entity))(record)
  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, Node.getUuid(entity)), siblingEntitiesAndSelf)
  // 2. get key values
  const keyValues = Record.getEntityKeyValues(survey, entity)(record)
  // 3. find duplicate sibling entity with same key values
  for (const siblingEntity of siblingEntities) {
    const siblingKeyValues = Record.getEntityKeyValues(survey, siblingEntity)(record)
    if (R.equals(keyValues, siblingKeyValues)) {
      return true
    }
  }
  return false
}

export default {
  validateAttributeKey
};
