const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')

const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const Validator = require('../../../../common/validation/validator')

const RecordRepository = require('../repository/recordRepository')

const CountValidator = require('./validators/countValidator')
const AttributeValidator = require('./validators/attributeValidator')
const KeysUniquenessValidator = require('./validators/keysUniquenessValidator')

const validateNodes = async (survey, record, nodes, tx) => {

  // 1. validate self and dependent attributes (validations/expressions)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)

  // 2. validate min/max count
  const nodePointers = fetchNodePointers(survey, record, nodes)
  const nodeCountValidations = CountValidator.validateChildrenCount(record, nodePointers)

  // 3. validate record keys uniqueness
  const recordKeysValidations = !Record.isPreview(record) && isRootNodeKeysUpdated(survey, nodes)
    ? await KeysUniquenessValidator.validateRecordKeysUniqueness(survey, record, tx)
    : {}

  // 4. validate entity keys uniqueness
  const entityKeysValidations = validateEntityKeysUniqueness(survey, record, nodes)

  // 5. merge validations
  const nodesValidation = Validator.recalculateValidity({
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(recordKeysValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(attributeValidations)
  })

  // 5. persist validation
  await persistValidation(survey, record, nodesValidation, tx)

  return nodesValidation
}

const validateEntityKeysUniqueness = (survey, record, nodes) => {
  const updatedEntities = getUpdatedEntitiesWithKeys(survey, record, nodes)
  const entityKeysValidationsArray = updatedEntities.map(
    entity =>
      KeysUniquenessValidator.validateEntityKeysUniqueness(survey, record, entity)
  )

  return R.pipe(
    R.flatten,
    R.mergeAll
  )(entityKeysValidationsArray)
}

const fetchNodePointers = (survey, record, nodes) => {
  const nodesArray = R.values(nodes)

  const nodePointers = nodesArray.map(
    node => {
      const pointers = []
      const nodeDef = getNodeDef(survey, node)

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

const isRootNodeKeysUpdated = (survey, nodes) => R.pipe(
  R.values,
  R.any(n => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(n))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isKey(nodeDef) && NodeDef.isRoot(parentDef)
    },
  )
)(nodes)

const getUpdatedEntitiesWithKeys = (survey, record, nodes) => {
  const entities = R.values(nodes).map(
    node => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)

      if (NodeDef.isEntity(nodeDef) && !R.isEmpty(Survey.getNodeDefKeys(nodeDef)(survey))) {
        // updated node is an entity with keys
        return node
      } else if (NodeDef.isKey(nodeDef) &&
        !NodeDef.isRoot(parentDef) &&
        !R.isEmpty(Survey.getNodeDefKeys(parentDef)(survey))) {
        // updated node is the key of a non-root entity with keys
        return Record.getParentNode(node)(record)
      } else {
        return null
      }
    }
  )
  return R.reject(R.isNil, entities)
}

const persistValidation = async (survey, record, nodesValidation, tx) => {
  const surveyId = Survey.getId(survey)

  const recordValidationUpdated = R.pipe(
    Validator.mergeValidation(nodesValidation),
    Validator.getValidation
  )(record)

  await RecordRepository.updateValidation(surveyId, Record.getUuid(record), recordValidationUpdated, tx)
}

const getNodeDef = (survey, node) =>
  Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

module.exports = {
  validateNodes
}