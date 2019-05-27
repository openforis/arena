const R = require('ramda')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')
const NodeDefValidations = require('../../survey/nodeDefValidations')

const Record = require('../record')
const Node = require('../node')
const RecordValidation = require('../recordValidation')

const Validator = require('../../validation/validator')
const NumberUtils = require('../../numberUtils')

const errorKeys = {
  minCountNodesNotSpecified: 'minCountNodesNotSpecified',
  maxCountNodesExceeded: 'maxCountNodesExceeded'
}

const validateChildrenCount = (survey, nodeParent, nodeDefChild, count) => {
  const validations = NodeDef.getValidations(nodeDefChild)

  const minCount = NumberUtils.toNumber(NodeDefValidations.getMinCount(validations))
  const maxCount = NumberUtils.toNumber(NodeDefValidations.getMaxCount(validations))
  const hasMinCount = !isNaN(minCount)
  const hasMaxCount = !isNaN(maxCount)

  const minCountValid = !hasMinCount || count >= minCount
  const maxCountValid = !hasMaxCount || count <= maxCount

  const childrenCountValidation = {
    [Validator.keys.valid]: minCountValid && maxCountValid,
    [Validator.keys.fields]: {
      [RecordValidation.keys.minCount]: {
        [Validator.keys.valid]: minCountValid,
        [Validator.keys.errors]: minCountValid ? [] : [errorKeys.minCountNodesNotSpecified]
      },
      [RecordValidation.keys.maxCount]: {
        [Validator.keys.valid]: maxCountValid,
        [Validator.keys.errors]: maxCountValid ? [] : [errorKeys.maxCountNodesExceeded]
      }
    }
  }

  return {
    [Validator.keys.fields]: {
      [RecordValidation.keys.childrenCount]: {
        [Validator.keys.fields]: {
          [NodeDef.getUuid(nodeDefChild)]: childrenCountValidation
        },
      }
    }
  }
}

const validateChildrenCountRecord = (survey, record) => {
  const nodePointers = _getNodePointersRecord(survey, record)
  return _validateChildrenCountNodePointers(survey, record, nodePointers)
}

const validateChildrenCountNodes = (survey, record, nodes) => {
  const nodePointers = _getNodePointers(survey, record, nodes)
  return _validateChildrenCountNodePointers(survey, record, nodePointers)
}

const _getNodePointersRecord = (survey, record) => {
  const nodePointers = []
  const { root } = Survey.getHierarchy()(survey)
  Survey.traverseHierarchyItemSync(root, nodeDefEntity => {
    const nodeDefChildren = Survey.getNodeDefChildren(nodeDefEntity)(survey)
    const nodeEntities = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDefEntity))(record)
    for (const nodeEntity of nodeEntities) {
      for (const childDef of nodeDefChildren) {
        if (_hasMinOrMaxCount(childDef)) {
          nodePointers.push({
            node: nodeEntity,
            childDef
          })
        }
      }
    }
  })
  return nodePointers
}

const _getNodePointers = (survey, record, nodes) => {
  const nodesArray = R.values(nodes)

  const nodePointers = nodesArray.map(
    node => {
      const pointers = []
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

      if (!NodeDef.isRoot(nodeDef)) {
        // add a pointer for every node
        const parent = Record.getParentNode(node)(record)
        pointers.push({
          node: parent,
          childDef: nodeDef
        })
      }

      if (NodeDef.isEntity(nodeDef) && !Node.isDeleted(node)) {
        // add children node pointers
        const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)

        pointers.push(
          childDefs.map(
            childDef => ({
              node,
              childDef
            })
          )
        )
      }

      return pointers
    }
  )

  return R.pipe(
    R.flatten,
    R.uniq
  )(nodePointers)
}

const _validateChildrenCountNodePointers = (survey, record, nodePointers) => {
  let validation = {}
  for (const nodePointer of nodePointers) {
    const { node, childDef } = nodePointer

    const count = _hasMinOrMaxCount(childDef) ? _countChildren(record, node, childDef) : 0

    const nodeValidation = validateChildrenCount(survey, node, childDef, count)

    validation = R.mergeDeepLeft({
      [Node.getUuid(node)]: nodeValidation
    }, validation)
  }
  return validation
}

const _hasMinOrMaxCount = nodeDef => {
  const validations = NodeDef.getValidations(nodeDef)
  return NodeDefValidations.hasMinOrMaxCount(validations)
}

const _countChildren = (record, parentNode, childDef) => {
  const nodes = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)

  return NodeDef.isEntity(childDef)
    ? nodes.length
    : R.pipe(
      R.reject(Node.isValueBlank),
      R.length
    )(nodes)
}

module.exports = {
  validateChildrenCountNodes,
  validateChildrenCountRecord,
  validateChildrenCount
}