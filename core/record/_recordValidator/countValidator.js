import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as RecordValidation from '@core/record/recordValidation'

import * as Validation from '@core/validation/validation'
import * as NumberUtils from '@core/numberUtils'

import * as Record from '../record'
import * as Node from '../node'

const _createValidationResult = (nodeDefUuid, isMinCountValidation, minCount, maxCount) => {
  if (minCount === maxCount) {
    return Validation.newInstance(false, {}, [
      {
        key: Validation.messageKeys.record.nodesCountInvalid,
        params: { nodeDefUuid, count: minCount },
      },
    ])
  }
  return Validation.newInstance(false, {}, [
    {
      key: isMinCountValidation
        ? Validation.messageKeys.record.nodesMinCountNotReached
        : Validation.messageKeys.record.nodesMaxCountExceeded,
      params: {
        nodeDefUuid,
        ...(isMinCountValidation ? { minCount } : { maxCount }),
      },
    },
  ])
}

export const validateChildrenCount = (nodeDefChild, count) => {
  const validations = NodeDef.getValidations(nodeDefChild)

  const minCount = NumberUtils.toNumber(NodeDefValidations.getMinCount(validations))
  const maxCount = NumberUtils.toNumber(NodeDefValidations.getMaxCount(validations))

  const minCountValid = Number.isNaN(minCount) || count >= minCount
  const maxCountValid = Number.isNaN(maxCount) || count <= maxCount

  return minCountValid && maxCountValid
    ? Validation.newInstance()
    : _createValidationResult(NodeDef.getUuid(nodeDefChild), !minCountValid, minCount, maxCount)
}

const _countChildren = (record, parentNode, childDef) =>
  R.pipe(
    Record.getNodeChildrenByDefUuidUnsorted(parentNode, NodeDef.getUuid(childDef)),
    R.when(R.always(NodeDef.isAttribute(childDef)), R.reject(Node.isValueBlank)),
    R.length
  )(record)

const _validateNodePointer = ({ record, nodeCtx, nodeDef }) => {
  // Check children count only for applicable nodes
  if (Node.isChildApplicable(NodeDef.getUuid(nodeDef))(nodeCtx)) {
    const nodeDefValidations = NodeDef.getValidations(nodeDef)
    if (NodeDefValidations.hasMinOrMaxCount(nodeDefValidations)) {
      // min or max count specified
      const count = _countChildren(record, nodeCtx, nodeDef)
      return validateChildrenCount(nodeDef, count)
    }
  }
  return Validation.newInstance()
}

const _getNodePointersToValidate = ({ survey, record, node }) => {
  const nodePointersToValidate = []

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (!NodeDef.isRoot(nodeDef)) {
    // always validate the node itself
    const nodeParent = Record.getParentNode(node)(record)
    nodePointersToValidate.push({ nodeCtx: nodeParent, nodeDef })
  }
  if (NodeDef.isEntity(nodeDef) && !Node.isDeleted(node)) {
    // validate the count of every node def children
    const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)
    childDefs.forEach((childDef) => nodePointersToValidate.push({ nodeCtx: node, nodeDef: childDef }))
  }
  return nodePointersToValidate
}

export const validateChildrenCountNodes = (survey, record, nodes) =>
  Object.values(nodes).reduce((validationsAcc, node) => {
    const validationsAccUpdated = { ...validationsAcc }
    const nodePointersToValidate = _getNodePointersToValidate({ survey, record, node })

    nodePointersToValidate.forEach((nodePointer) => {
      // check if validated already
      const validationChildrenCountKey = RecordValidation.getValidationChildrenCountKey(
        nodePointer.nodeCtx.uuid,
        nodePointer.nodeDef.uuid
      )
      if (!(validationChildrenCountKey in validationsAccUpdated)) {
        // validate the children count of this node pointer
        const validationNodePointer = _validateNodePointer({
          record,
          nodeCtx: nodePointer.nodeCtx,
          nodeDef: nodePointer.nodeDef,
        })
        validationsAccUpdated[validationChildrenCountKey] = validationNodePointer
      }
    })
    return validationsAccUpdated
  }, {})
