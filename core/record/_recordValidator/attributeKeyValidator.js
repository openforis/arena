import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'
import * as Record from '../record'
import * as Node from '../node'

export const validateAttributeKey = (survey, record, attributeDef) => async (
  propName,
  node,
) => {
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
  const nodeParent = Record.getParentNode(entity)(record)
  const siblingEntities = R.pipe(
    Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(entity)),
    R.reject(ObjectUtils.isEqual(entity)),
  )(record)

  // 2. get key values
  const keyValues = Record.getEntityKeyValues(survey, entity)(record)

  return R.isEmpty(siblingEntities) || R.isEmpty(keyValues)
    ? false
    : R.any(
        siblingEntity =>
          R.equals(
            keyValues,
            Record.getEntityKeyValues(survey, siblingEntity)(record),
          ),
        siblingEntities,
      )
}
