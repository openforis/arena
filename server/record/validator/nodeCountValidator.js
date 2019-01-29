const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../common/survey/nodeDefValidations')

const Node = require('../../../common/record/node')
const Validator = require('../../../common/validation/validator')
const NumberUtils = require('../../../common/numberUtils')

const NodeRepository = require('../nodeRepository')

const errorKeys = {
  minCountNodesNotSpecified: 'minCountNodesNotSpecified',
  maxCountNodesExceeded: 'maxCountNodesExceeded'
}

const validateChildrenCount = async (survey, recordUuid, nodePointers, tx) => {
  const nodePointersValidated = await Promise.all(
    nodePointers.map(
      async nodePointer => {
        const { nodeCtx, nodeDef } = nodePointer
        const validations = NodeDef.getValidations(nodeDef)
        const minCount = NumberUtils.toNumber(NodeDefValidations.getMinCount(validations))
        const maxCount = NumberUtils.toNumber(NodeDefValidations.getMaxCount(validations))

        if(isNaN(minCount) && isNaN(maxCount))
          return {}

        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const nodeCtxUuid = Node.getUuid(nodeCtx)

        const count = await NodeRepository.countChildNodesByNodeDefUuid(Survey.getId(survey), recordUuid, nodeCtxUuid, nodeDefUuid, tx)

        const minCountValid = isNaN(minCount) || count >= minCount
        const maxCountValid = isNaN(maxCount) || count <= maxCount

        const childrenCountValidation = {
          [Validator.keys.valid]: minCountValid && maxCountValid,
          [Validator.keys.errors]:
            !minCountValid
              ? [errorKeys.minCountNodesNotSpecified]
              : !maxCountValid
              ? [errorKeys.maxCountNodesExceeded]
              : null
        }
        return {
          [nodeCtxUuid]: {
            [Validator.keys.fields]: {
              'childrenCount': {
                [Validator.keys.fields]: {
                  [nodeDefUuid]: childrenCountValidation
                }
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