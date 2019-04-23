const R = require('ramda')

const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../../common/survey/nodeDefValidations')

const Record = require('../../../../../common/record/record')
const Node = require('../../../../../common/record/node')
const RecordValidation = require('../../../../../common/record/recordValidation')
const Validator = require('../../../../../common/validation/validator')
const NumberUtils = require('../../../../../common/numberUtils')

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

const validateChildrenCount = (record, nodePointers) => {
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
          'minCount': {
            [Validator.keys.valid]: minCountValid,
            [Validator.keys.errors]: minCountValid ? [] : [errorKeys.minCountNodesNotSpecified]
          },
          'maxCount': {
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