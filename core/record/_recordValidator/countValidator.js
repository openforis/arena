import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as RecordValidation from '@core/record/recordValidation'

import * as Validation from '@core/validation/validation'
import * as NumberUtils from '@core/numberUtils'
import * as Record from '../record'
import * as Node from '../node'

export const validateChildrenCount = (nodeDefChild, count) => {
  const validations = NodeDef.getValidations(nodeDefChild)

  const minCount = NumberUtils.toNumber(NodeDefValidations.getMinCount(validations))
  const maxCount = NumberUtils.toNumber(NodeDefValidations.getMaxCount(validations))

  const minCountValid = isNaN(minCount) || count >= minCount
  const maxCountValid = isNaN(maxCount) || count <= maxCount

  return minCountValid && maxCountValid
    ? Validation.newInstance()
    : _createValidationResult(NodeDef.getUuid(nodeDefChild), !minCountValid, minCount, maxCount)
}

export const validateChildrenCountNodes = (survey, record, nodes) => {
  const nodePointers = _getNodePointers(survey, record, nodes)
  return _validateChildrenCountNodePointers(record, nodePointers)
}

const _getNodePointers = (survey, record, nodes) => {
  const nodePointers = []

  for (const node of Object.values(nodes)) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

    if (!NodeDef.isRoot(nodeDef)) {
      // Add a pointer for every node
      const nodeParent = Record.getParentNode(node)(record)
      nodePointers.push({
        nodeCtx: nodeParent,
        nodeDef,
      })
    }

    if (NodeDef.isEntity(nodeDef) && !Node.isDeleted(node)) {
      // Add children node pointers
      const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)

      for (const childDef of childDefs) {
        nodePointers.push({
          nodeCtx: node,
          nodeDef: childDef,
        })
      }
    }
  }

  return R.uniq(nodePointers)
}

const _validateChildrenCountNodePointers = (record, nodePointers) => {
  const validationsByField = {}
  for (const { nodeCtx, nodeDef } of nodePointers) {
    let nodeValidation = null

    // Check children count only for applicable nodes
    if (Node.isChildApplicable(NodeDef.getUuid(nodeDef))(nodeCtx)) {
      const count = _hasMinOrMaxCount(nodeDef) ? _countChildren(record, nodeCtx, nodeDef) : 0
      nodeValidation = validateChildrenCount(nodeDef, count)
    } else {
      // Not applicable nodes are always valid
      nodeValidation = Validation.newInstance()
    }

    // Add validation to output validation
    validationsByField[
      RecordValidation.getValidationChildrenCountKey(Node.getUuid(nodeCtx), NodeDef.getUuid(nodeDef))
    ] = nodeValidation
  }

  return validationsByField
}

const _hasMinOrMaxCount = nodeDef => {
  const validations = NodeDef.getValidations(nodeDef)
  return NodeDefValidations.hasMinOrMaxCount(validations)
}

const _countChildren = (record, parentNode, childDef) =>
  R.pipe(
    Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef)),
    R.when(R.always(NodeDef.isAttribute(childDef)), R.reject(Node.isValueBlank)),
    R.length,
  )(record)

const _createValidationResult = (nodeDefUuid, isMinCountValidation, minCount, maxCount) =>
  Validation.newInstance(false, {}, [
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
