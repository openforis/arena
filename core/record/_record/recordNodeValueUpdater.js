import { RecordUpdateResult } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Node from '@core/record/node'

import { NodeValues } from '../nodeValues'

export const updateAttributeValue = ({
  survey,
  record,
  entity,
  attributeDef,
  attribute,
  value,
  dateModified: dataModifiedParam = null,
  sideEffect = false,
}) => {
  if (
    !NodeValues.isValueEqual({
      survey,
      nodeDef: attributeDef,
      value: Node.getValue(attribute),
      valueSearch: value,
      record,
      parentNode: entity,
      strict: true,
    }) ||
    dataModifiedParam // always update attribute when dateModified changes
  ) {
    // update existing attribute (if value changed);
    // do not update meta defaultValue applied flag (value could have been a default value already)
    const attributeUpdated = A.pipe(
      Node.assocValue(value),
      Node.assocUpdated(true),
      Node.assocDateModified(dataModifiedParam ?? new Date()),
      (nodeUpdated) =>
        // reset defaultValueApplied meta information
        Node.isDefaultValueApplied(attribute) ? Node.assocIsDefaultValueApplied(false)(nodeUpdated) : nodeUpdated
    )(attribute)

    const updateResult = new RecordUpdateResult({ record })
    updateResult.addNode(attributeUpdated, { sideEffect })
    return updateResult
  }
  // no updates performed
  return null
}
