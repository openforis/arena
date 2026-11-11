import { RecordUpdateResult } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { NodeValues } from '../nodeValues'

export const updateAttributeValue = ({
  survey,
  record,
  entity,
  attributeDef,
  attribute,
  value,
  refData = null,
  dateModified: dataModifiedParam = null,
  sideEffect = false,
}) => {
  const valueChanged = !NodeValues.isValueEqual({
    survey,
    nodeDef: attributeDef,
    value: Node.getValue(attribute),
    valueSearch: value,
    record,
    parentNode: entity,
    strict: true,
  })
  if (
    valueChanged ||
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
        Node.isDefaultValueApplied(attribute) ? Node.assocIsDefaultValueApplied(false)(nodeUpdated) : nodeUpdated,
      (nodeUpdated) => {
        if (refData) return NodeRefData.assocRefData(refData)(nodeUpdated)
        // ref data of the previous value would be read by the expression evaluator instead of the new value
        return valueChanged ? NodeRefData.dissocRefData(nodeUpdated) : nodeUpdated
      }
    )(attribute)

    const updateResult = new RecordUpdateResult({ record })
    updateResult.addNode(attributeUpdated, { sideEffect })
    return updateResult
  }
  // no updates performed
  return null
}
