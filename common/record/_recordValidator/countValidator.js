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

const countChildren = (record, parentNode, childDef) => {
  const nodes = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)

  return NodeDef.isEntity(childDef)
    ? nodes.length
    : R.pipe(
      R.reject(Node.isValueBlank),
      R.length
    )(nodes)
}

const getNodePointers = (survey, record, nodes) => {
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

const validateChildrenCount = (survey, record, nodes) => {
  const nodePointers = getNodePointers(survey, record, nodes)

  const nodePointersValidated = nodePointers.map(
    nodePointer => {
      const { node, childDef } = nodePointer

      const validations = NodeDef.getValidations(childDef)
      const minCount = NumberUtils.toNumber(NodeDefValidations.getMinCount(validations))
      const maxCount = NumberUtils.toNumber(NodeDefValidations.getMaxCount(validations))
      const hasMinCount = !isNaN(minCount)
      const hasMaxCount = !isNaN(maxCount)

      const count = (hasMinCount || hasMaxCount) ? countChildren(record, node, childDef) : 0

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
        [Node.getUuid(node)]: {
          [Validator.keys.fields]: {
            [RecordValidation.keys.childrenCount]: {
              [Validator.keys.fields]: {
                [NodeDef.getUuid(childDef)]: childrenCountValidation
              },
            }
          }
        }
      }

    }
  )

  return R.pipe(
    R.flatten,
    R.reduce(R.mergeDeepRight, {}),
  )(nodePointersValidated)
}

module.exports = {
  validateChildrenCount
}