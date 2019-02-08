const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const RecordValidation = require('../../../../common/record/recordValidation')
const Node = require('../../../../common/record/node')
const Validator = require('../../../../common/validation/validator')

const NodeRepository = require('../../nodeRepository')

const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const errorKeys = {
  duplicateRecordKey: 'duplicateRecordKey',
  duplicateEntity: 'duplicateEntity'
}

const validateEntityKeysUniqueness = (survey, record, nodeEntity) => {

  // 1. find all sibling entities

  const parentNode = Record.getParentNode(nodeEntity)(record)
  const siblingEntities = Record.getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(nodeEntity))(record)

  // 2. validate all sibling entities uniqueness

  const entityValidations = siblingEntities.map(
      siblingEntity => {
        const isDuplicate = isDuplicateEntity(survey, record, siblingEntities, siblingEntity)

        // 3. return entityKeys validation for each sibling entity key attribute
        const keyNodes = fetchEntityKeyNodes(survey, record, siblingEntity)
        return keyNodes.map(
          keyNode => ({
            [Node.getUuid(keyNode)]: {
              [Validator.keys.fields]: {
                [RecordValidation.keys.entityKeys]: {
                  [Validator.keys.errors]: isDuplicate ? [errorKeys.duplicateEntity] : [],
                  [Validator.keys.valid]: !isDuplicate
                }
              }
            }
          })
        )
      }
    )
  return R.pipe(
    R.flatten,
    R.mergeAll
  )(entityValidations)
}

const isDuplicateEntity = (survey, record, siblingEntitiesAndSelf, entity) => {
  const entityUuid = Node.getUuid(entity)

  // 1. skip current entity among all entities

  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, entityUuid), siblingEntitiesAndSelf)

  // 2. fetch key values

  const keyValues = fetchKeyValues(survey, record, entity)

  // 3. find duplicate sibling entity with same key values

  for (const siblingEntity of siblingEntities) {
    const siblingKeyValues = fetchKeyValues(survey, record, siblingEntity)
    if (R.equals(keyValues, siblingKeyValues)) {
      return true
    }
  }
  return false
}

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  const recordUuid = Record.getUuid(record)

  // 1. fetch records with same keys
  const records = await SurveyRdbManager.queryRootTableByRecordKeys(survey, recordUuid, tx)

  // 2. check if record is unique
  const isUnique = R.pipe(
    // exclude current record
    R.reject(R.propEq(Record.keys.uuid, recordUuid)),
    R.isEmpty
  )(records)

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)

  const keyNodes = fetchEntityKeyNodes(survey, record, rootNode)

  // 4. associate validation error to each key node
  return R.pipe(
    R.map(keyNode => ({
        [Node.getUuid(keyNode)]: {
          [Validator.keys.fields]: {
            [RecordValidation.keys.recordKeys]: {
              [Validator.keys.errors]: isUnique ? [] : [errorKeys.duplicateRecordKey],
              [Validator.keys.valid]: isUnique
            }
          }
        }
      })
    ),
    R.flatten,
    R.mergeAll
  )(keyNodes)
}

// ==== UTILS

const fetchKeyValues = (survey, record, entity) => {
  const keyNodes = fetchEntityKeyNodes(survey, record, entity)
  return R.map(Node.getNodeValue)(keyNodes)
}

const fetchEntityKeyNodes = (survey, record, entity) => {
  const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)
  const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)

  return R.pipe(
    R.map(keyDef => R.head(Record.getNodeChildrenByDefUuid(entity, NodeDef.getUuid(keyDef))(record))),
    R.flatten,
  )(keyDefs)
}

module.exports = {
  validateRecordKeysUniqueness,
  validateEntityKeysUniqueness
}