const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

const Node = require('../../../common/record/node')
const Validator = require('../../../common/validation/validator')

const RecordRepository = require('../recordRepository')
const NodeRepository = require('../nodeRepository')

const CountValidator = require('./helpers/countValidator')
const AttributeValidator = require('./helpers/attributeValidator')
const KeysUniquenessValidator = require('./helpers/keysUniquenessValidator')

const validateNodes = async (survey, recordUuid, nodes, preview, tx) => {

  // 1. validate self and dependent attributes (validations/expressions)
  const nodesDependentValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, nodes, tx)

  // 2. validate min/max count
  const nodePointers = await fetchNodePointers(survey, nodes, tx)
  const nodeCountValidations = await CountValidator.validateChildrenCount(survey, recordUuid, nodePointers, tx)

  // 3. validate record keys uniqueness
  const recordKeysValidations = !preview && isRootNodeKeysUpdated(survey, nodes)
    ? await KeysUniquenessValidator.validateRecordKeysUniqueness(survey, recordUuid, tx)
    : {}

  // 4. validate entity keys uniqueness
  const entityKeysValidations = await validateEntityKeysUniqueness(survey, recordUuid, nodes, tx)

  // 5. merge validations
  const nodesValidation = {
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(recordKeysValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(nodesDependentValidations)
  }

  // 5. persist validation
  await persistValidation(survey, recordUuid, nodesValidation, tx)

  return nodesValidation
}

const validateEntityKeysUniqueness = async (survey, recordUuid, nodes, tx) => {
  const updatedEntities = await getUpdatedEntities(survey, nodes, tx)
  const entityKeysValidationsArray = await Promise.all(
    updatedEntities.map(
      async entity =>
        await KeysUniquenessValidator.validateEntityKeysUniqueness(survey, recordUuid, entity, tx)
    )
  )
  return R.pipe(
    R.flatten,
    R.mergeAll
  )(entityKeysValidationsArray)
}

const fetchNodePointers = async (survey, nodes, tx) => {
  const nodesArray = R.values(nodes)

  const nodePointers = await Promise.all(
    nodesArray.map(
      async node => {
        const pointers = []
        const nodeDef = getNodeDef(survey, node)

        if (!NodeDef.isNodeDefRoot(nodeDef)) {
          // add a pointer for every node
          const parent = await NodeRepository.fetchNodeByUuid(Survey.getId(survey), Node.getParentUuid(node), tx)
          pointers.push({
            node: parent,
            childDef: nodeDef
          })
        }

        if (NodeDef.isNodeDefEntity(nodeDef)) {
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

const persistValidation = async (survey, recordUuid, nodesValidation, tx) => {
  const surveyId = Survey.getId(survey)
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, tx)

  const recordValidationUpdated = R.pipe(
    Validator.mergeValidation(nodesValidation),
    Validator.getValidation
  )(record)

  await RecordRepository.updateValidation(surveyId, recordUuid, recordValidationUpdated, tx)
}

const getNodeDef = (survey, node) =>
  Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

module.exports = {
  validateNodes
}