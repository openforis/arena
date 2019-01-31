const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

const Node = require('../../../common/record/node')
const Validator = require('../../../common/validation/validator')

const RecordRepository = require('../recordRepository')
const NodeRepository = require('../nodeRepository')

const CountValidator = require('./helpers/countValidator')
const ValidationExpressionsEvaluator = require('./helpers/validationExpressionsEvaluator')
const KeysUniquenessValidator = require('./helpers/keysUniquenessValidator')

const validateNodes = async (survey, recordUuid, nodes, preview, tx) => {

  // 1. validate self and dependent nodes (validations/expressions)
  const nodesDependentValidations = await ValidationExpressionsEvaluator.validateSelfAndDependentNodes(survey, recordUuid, nodes, tx)

  // 2. validate min/max count
  const nodePointers = await fetchNodePointers(survey, nodes, tx)
  const nodeCountValidations = await CountValidator.validateChildrenCount(survey, recordUuid, nodePointers, tx)

  // 3. validate record keys uniqueness
  const recordKeysValidations = !preview && isRootNodeKeysUpdated(survey, nodes)
    ? await KeysUniquenessValidator.validateRecordKeysUniqueness(survey, recordUuid, tx)
    : {}

  // 4. validate entity keys uniqueness
  const updatedEntities = await getUpdatedEntities(survey, nodes, tx)
  const entityKeysValidationsArray = await Promise.all(
    updatedEntities.map(
      async nodeEntity =>
        await KeysUniquenessValidator.validateEntityKeysUniqueness(survey, recordUuid, nodeEntity, tx)
    )
  )
  const entityKeysValidations = R.pipe(
    R.flatten,
    R.mergeAll
  )(entityKeysValidationsArray)

  // 5. merge validations
  const nodesValidation = {
    fields: R.pipe(
      R.mergeLeft(nodeCountValidations),
      R.mergeLeft(recordKeysValidations),
      R.mergeLeft(entityKeysValidations)
    )(nodesDependentValidations)
  }

  // 5. persist validation
  const surveyId = Survey.getId(survey)
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, tx)

  const recordValidationUpdated = R.pipe(
    Validator.mergeValidation(nodesValidation),
    Validator.getValidation
  )(record)

  await RecordRepository.updateValidation(surveyId, recordUuid, recordValidationUpdated, tx)

  return nodesValidation
}

const fetchNodePointers = async (survey, nodes, tx) => {
  const nodesArray = R.values(nodes)

  const nodePointers = await Promise.all(
    nodesArray.map(
      async node => {
        const pointers = []
        const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

        if (NodeDef.isNodeDefEntity(nodeDef)) {
          const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)

          pointers.push(
            childDefs.map(
              childDef => ({
                nodeCtx: node,
                nodeDef: childDef
              })
            )
          )
        }
        if (!NodeDef.isNodeDefRoot(nodeDef)) {
          const parent = await NodeRepository.fetchNodeByUuid(Survey.getId(survey), Node.getParentUuid(node), tx)
          pointers.push({
            nodeCtx: parent,
            nodeDef
          })
        }
        return pointers
      }
    )
  )
  return R.pipe(
    R.flatten,
    R.uniq
  )(nodePointers)
}

const isRootNodeKeysUpdated = (survey, nodes) => R.pipe(
  R.values,
  R.any(n => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(n))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isNodeDefKey(nodeDef) && NodeDef.isNodeDefRoot(parentDef)
    },
  )
)(nodes)

const getUpdatedEntities = async (survey, nodes, tx) => {
  const entities = await Promise.all(
    R.values(nodes).map(
      async node => {
        const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
        const parentDef = Survey.getNodeDefParent(nodeDef)(survey)

        if (NodeDef.isNodeDefKey(nodeDef) &&
          !NodeDef.isNodeDefRoot(parentDef) &&
          !R.isEmpty(Survey.getNodeDefKeys(parentDef)(survey))) {
          return await NodeRepository.fetchNodeByUuid(Survey.getId(survey), Node.getParentUuid(node), tx)
        } else {
          return null
        }
      })
  )
  return R.reject(R.isNil, entities)
}

module.exports = {
  validateNodes
}