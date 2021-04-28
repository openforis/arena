import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'
import * as Record from '../record'
import * as Node from '../node'

const _isAttributeDuplicate = ({ record, attribute, attributeDef }) => {
  const parentNode = Record.getParentNode(attribute)(record)
  const ancestorEntity = Record.getParentNode(parentNode)(record)
  const siblingEntities = Record.getNodeChildrenByDefUuid(ancestorEntity, NodeDef.getParentUuid(attributeDef))(record)

  const nodeSiblings = siblingEntities.reduce((siblingsAcc, siblingEntity) => {
    siblingsAcc.push(...Record.getNodeChildrenByDefUuid(siblingEntity, NodeDef.getUuid(attributeDef))(record))
    return siblingsAcc
  }, [])

  return nodeSiblings.some(
    (sibling) => !Node.isEqual(attribute)(sibling) && R.equals(Node.getValue(sibling), Node.getValue(attribute))
  )
}

export const validateAttributeUnique = (survey, record, attributeDef) => async (propName, node) => {
  const nodeDefParent = Survey.getNodeDefParent(attributeDef)(survey)
  const nodeDefValidations = NodeDef.getValidations(attributeDef)

  // uniqeness at record level evaluated else where
  if (!NodeDefValidations.isUnique(nodeDefValidations) || NodeDef.isRoot(nodeDefParent)) {
    return null
  }
  if (_isAttributeDuplicate({ record, attribute: node, attributeDef })) {
    return { key: Validation.messageKeys.record.uniqueAttributeDuplicate }
  }

  return null
}
