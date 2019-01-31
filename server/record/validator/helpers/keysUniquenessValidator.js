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
  duplicateRecord: 'duplicateRecord',
  duplicateEntity: 'duplicateEntity'
}

const validateEntityKeysUniqueness = async (survey, recordUuid, nodeEntity, tx) => {

  // 1. find all entities

  const surveyId = Survey.getId(survey)

  const allEntities = await NodeRepository.fetchChildNodesByNodeDefUuid(surveyId, recordUuid,
    Node.getParentUuid(nodeEntity), Node.getNodeDefUuid(nodeEntity), tx)

  // 2. check if specified entity is duplicate

  const isDuplicate = await isDuplicateEntity(survey, recordUuid, allEntities, nodeEntity, tx)

  // 3. return entityKeys validation for each entity

  return allEntities.map(e => ({
      [Node.getUuid(e)]: {
        [Validator.keys.fields]: {
          [RecordValidation.keys.entityKeys]: {
            [Validator.keys.errors]: isDuplicate ? [errorKeys.duplicateEntity] : [],
            [Validator.keys.valid]: !isDuplicate
          }
        },
        [Validator.keys.valid]: !isDuplicate
      }
    })
  )
}

const isDuplicateEntity = async (survey, recordUuid, allEntities, entity, tx) => {
  const entityUuid = Node.getUuid(entity)
  const surveyId = Survey.getId(survey)

  // 1. skip current entity among all entities

  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, entityUuid), allEntities)

  // 2. fetch key values

  const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)
  const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)

  const keyValues = await fetchKeyValues(surveyId, recordUuid, entityUuid, keyDefs, tx)

  // 3. find duplicate sibling entity with same key values

  for (const siblingEntity of siblingEntities) {
    const siblingKeyValues = await fetchKeyValues(surveyId, recordUuid, Node.getUuid(siblingEntity), keyDefs, tx)

    if (R.equals(keyValues, siblingKeyValues)) {
      return true
    }
  }
  return false
}

const fetchKeyValues = async (surveyId, recordUuid, entityUuid, keyDefs, tx) => {
  const keyNodes = await NodeRepository.fetchChildNodesByNodeDefUuids(surveyId, recordUuid, entityUuid, R.pluck(NodeDef.keys.uuid, keyDefs), tx)
  return R.pluck(Node.keys.value, keyNodes)
}

const validateRecordKeysUniqueness = async (survey, recordUuid, tx) => {

  // 1. fetch records with same keys
  const records = await SurveyRdbManager.queryRootTableByRecordKeys(survey, recordUuid, tx)

  // 2. check if record is unique
  const isUnique = R.pipe(
    // exclude current record
    R.reject(R.propEq(Record.keys.uuid, recordUuid)),
    R.isEmpty
  )(records)

  // 3. fetch root entity
  const rootDef = Survey.getRootNodeDef(survey)
  const rootNode = await NodeRepository.fetchChildNodeByNodeDefUuid(Survey.getId(survey), recordUuid, null, NodeDef.getUuid(rootDef), tx)

  // 4. associate validation error to root entity
  return {
    [Node.getUuid(rootNode)]: {
      [Validator.keys.fields]: {
        [RecordValidation.keys.recordKeys]: {
          [Validator.keys.errors]: isUnique ? [] : [errorKeys.duplicateRecord],
          [Validator.keys.valid]: isUnique
        }
      },
      [Validator.keys.valid]: isUnique
    }
  }
}

module.exports = {
  validateRecordKeysUniqueness,
  validateEntityKeysUniqueness
}