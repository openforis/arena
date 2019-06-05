const R = require('ramda')

const Record = require('../../../../../common/record/record')
const RecordValidation = require('../../../../../common/record/recordValidation')
const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')

const SurveyRdbManager = require('../../../surveyRdb/manager/surveyRdbManager')

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
      const isDuplicate = _isEntityDuplicate(survey, record, siblingEntities, siblingEntity)

      // 3. return entityKeys validation for each sibling entity key attribute
      const keyNodes = Record.getEntityKeyNodes(survey, siblingEntity)(record)
      return keyNodes.map(
        keyNode => ({
          [Node.getUuid(keyNode)]: {
            [Validator.keys.fields]: {
              [RecordValidation.keys.entityKeys]: {
                [Validator.keys.errors]: isDuplicate ? [{ key: errorKeys.duplicateEntity }] : [],
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

const _isEntityDuplicate = (survey, record, siblingEntitiesAndSelf, entity) => {
  // 1. skip current entity among all entities

  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, Node.getUuid(entity)), siblingEntitiesAndSelf)

  // 2. fetch key values

  const keyValues = Record.getEntityKeyValues(survey, entity)(record)

  // 3. find duplicate sibling entity with same key values

  for (const siblingEntity of siblingEntities) {
    const siblingKeyValues = Record.getEntityKeyValues(survey, siblingEntity)(record)
    if (R.equals(keyValues, siblingKeyValues)) {
      return true
    }
  }
  return false
}

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  // 1. check if record is unique
  const recordsCount = await SurveyRdbManager.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)

  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  return R.pipe(
    R.map(keyNode => ({
        [Node.getUuid(keyNode)]: {
          [Validator.keys.fields]: {
            [RecordValidation.keys.recordKeys]: {
              [Validator.keys.errors]: isUnique ? [] : [{ key: errorKeys.duplicateRecordKey }],
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

module.exports = {
  validateRecordKeysUniqueness,
  validateEntityKeysUniqueness
}