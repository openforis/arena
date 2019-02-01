const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../common/survey/nodeDefValidations')

const Node = require('../../../../common/record/node')
const RecordValidation = require('../../../../common/record/recordValidation')
const Validator = require('../../../../common/validation/validator')
const NumberUtils = require('../../../../common/numberUtils')

const NodeRepository = require('../../nodeRepository')

const errorKeys = {
  minCountNodesNotSpecified: 'minCountNodesNotSpecified',
  maxCountNodesExceeded: 'maxCountNodesExceeded'
}

const validateChildrenCount = async (survey, recordUuid, nodePointers, tx) => {
  const nodePointersValidated = await Promise.all(
    nodePointers.map(
      async nodePointer => {
        const { node, childDef } = nodePointer
        const validations = NodeDef.getValidations(childDef)
        const minCount = NumberUtils.toNumber(NodeDefValidations.getMinCount(validations))
        const maxCount = NumberUtils.toNumber(NodeDefValidations.getMaxCount(validations))

        if (isNaN(minCount) && isNaN(maxCount))
          return {}

        const childDefUuid = NodeDef.getUuid(childDef)
        const nodeUuid = Node.getUuid(node)

        const nodes = await NodeRepository.fetchChildNodesByNodeDefUuid(Survey.getId(survey), recordUuid, nodeUuid, childDefUuid, tx)
        const count = NodeDef.isNodeDefEntity(childDef)
          ? nodes.length
          : R.pipe(
            R.reject(Node.isNodeValueBlank),
            R.length
          )(nodes)

        const minCountValid = isNaN(minCount) || count >= minCount
        const maxCountValid = isNaN(maxCount) || count <= maxCount
        const valid = minCountValid && maxCountValid

        const childrenCountValidation = {
          [Validator.keys.valid]: valid,
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
          [nodeUuid]: {
            [Validator.keys.fields]: {
              [RecordValidation.keys.childrenCount]: {
                [Validator.keys.fields]: {
                  [childDefUuid]: childrenCountValidation
                },
                [Validator.keys.valid]: valid
              }
            }
          }
        }
      }
    )
  )

  return R.pipe(
    R.flatten,
    R.reduce(R.mergeDeepRight, {}),
  )(nodePointersValidated)
}

module.exports = {
  validateChildrenCount
}