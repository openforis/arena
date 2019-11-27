import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as Validation from '@core/validation/validation'
import * as NumberUtils from '@core/numberUtils'
import * as Record from '../record'
import * as Node from '../node'
import * as RecordValidation from '../recordValidation'

export const validateChildrenCount = (
  survey,
  nodeParent,
  nodeDefChild,
  count,
) => {
  const validations = NodeDef.getValidations(nodeDefChild)

  const minCount = NumberUtils.toNumber(
    NodeDefValidations.getMinCount(validations),
  )
  const maxCount = NumberUtils.toNumber(
    NodeDefValidations.getMaxCount(validations),
  )

  const minCountValid = isNaN(minCount) || count >= minCount
  const maxCountValid = isNaN(maxCount) || count <= maxCount

  return _createValidationResult(
    nodeDefChild,
    minCountValid,
    maxCountValid,
    minCount,
    maxCount,
  )
}

export const validateChildrenCountNodes = (survey, record, nodes) => {
  const nodePointers = _getNodePointers(survey, record, nodes)
  return _validateChildrenCountNodePointers(survey, record, nodePointers)
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

const _validateChildrenCountNodePointers = (survey, record, nodePointers) => {
  let validation = {}
  for (const {nodeCtx, nodeDef} of nodePointers) {
    let nodeValidation = null

    // Check children count only for applicable nodes
    if (Node.isChildApplicable(NodeDef.getUuid(nodeDef))(nodeCtx)) {
      const count = _hasMinOrMaxCount(nodeDef)
        ? _countChildren(record, nodeCtx, nodeDef)
        : 0
      nodeValidation = validateChildrenCount(survey, nodeCtx, nodeDef, count)
    } else {
      // Not applicable nodes are always valid
      nodeValidation = _createValidationResult(nodeDef, true, true)
    }

    // Add node validation to output validation
    validation = R.mergeDeepLeft(
      {
        [Node.getUuid(nodeCtx)]: nodeValidation,
      },
      validation,
    )
  }

  return validation
}

const _hasMinOrMaxCount = nodeDef => {
  const validations = NodeDef.getValidations(nodeDef)
  return NodeDefValidations.hasMinOrMaxCount(validations)
}

const _countChildren = (record, parentNode, childDef) => {
  const nodes = Record.getNodeChildrenByDefUuid(
    parentNode,
    NodeDef.getUuid(childDef),
  )(record)

  return NodeDef.isEntity(childDef)
    ? nodes.length
    : R.pipe(R.reject(Node.isValueBlank), R.length)(nodes)
}

const _createValidationResult = (
  nodeDefChild,
  minCountValid,
  maxCountValid,
  minCount,
  maxCount,
) =>
  Validation.newInstance(true, {
    [RecordValidation.keys.childrenCount]: Validation.newInstance(true, {
      [NodeDef.getUuid(nodeDefChild)]: Validation.newInstance(
        minCountValid && maxCountValid,
        {
          [RecordValidation.keys.minCount]: Validation.newInstance(
            minCountValid,
            {},
            minCountValid
              ? []
              : [
                  {
                    key: Validation.messageKeys.record.nodesMinCountNotReached,
                    params: {minCount},
                  },
                ],
          ),
          [RecordValidation.keys.maxCount]: Validation.newInstance(
            maxCountValid,
            {},
            maxCountValid
              ? []
              : [
                  {
                    key: Validation.messageKeys.record.nodesMaxCountExceeded,
                    params: {maxCount},
                  },
                ],
          ),
        },
      ),
    }),
  })
