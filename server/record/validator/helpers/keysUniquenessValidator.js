const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const Validator = require('../../../../common/validation/validator')

const NodeRepository = require('../../nodeRepository')

const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const errorKeys = {
  duplicateRecord: 'duplicateRecord',
  duplicateEntity: 'duplicateEntity'
}

const validationFields = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys'
}

const validateEntityKeysUniqueness = async (survey, recordUuid, nodeEntity, tx) => {

  const entityDefUuid = Node.getNodeDefUuid(nodeEntity)

  // 1. find all sibling entities

  const surveyId = Survey.getId(survey)
  const entityUuid = Node.getUuid(nodeEntity)

  const allEntities = await NodeRepository.fetchChildNodesByNodeDefUuid(surveyId, recordUuid, Node.getParentUuid(nodeEntity), entityDefUuid, tx)

  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, entityUuid), allEntities)

  // 2. fetch key values

  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)

  const keyValues = await fetchKeyValues(surveyId, recordUuid, entityUuid, keyDefs, tx)

  console.log(keyValues)

  // 3. find duplicate sibling entity with same key values

  for (const siblingEntity of siblingEntities) {
    const siblingKeyValues = await fetchKeyValues(surveyId, recordUuid, Node.getUuid(siblingEntity), keyDefs, tx)
    if (R.equals(keyValues, siblingKeyValues)) {
      //duplicate entity found
      return {
        [Node.getUuid(siblingEntity)]: {
          [Validator.keys.fields]: {
            [validationFields.entityKeys]: {
              [Validator.keys.errors]: [errorKeys.duplicateEntity],
              [Validator.keys.valid]: false
            }
          }
        }
      }
    }
  }
  return {}
}

const fetchKeyValues = async (surveyId, recordUuid, entityUuid, keyDefs, tx) => {
  const keyNodes = await NodeRepository.fetchChildNodesByNodeDefUuids(surveyId, recordUuid, entityUuid, R.pluck(NodeDef.keys.uuid, keyDefs), tx)
  return R.pluck(Node.keys.value, keyNodes)
}

const validateRecordKeysUniqueness = async (survey, recordUuid, tx) => {

  // 1. fetch records with same keys
  const records = await SurveyRdbManager.queryRootTableByRecordKeys(survey, recordUuid, tx)

  // 2. exclude record with same uuid
  const isUnique = R.pipe(
    R.reject(R.propEq(Record.keys.uuid, recordUuid)),
    R.isEmpty
  )(records)

  if (isUnique) {
    return {}
  } else {
    // duplicate
    // 3. fetch root entity
    const rootDef = Survey.getRootNodeDef(survey)
    const rootNode = await NodeRepository.fetchChildNodeByNodeDefUuid(Survey.getId(survey), recordUuid, null, NodeDef.getUuid(rootDef), tx)

    // 4. associate validation error to root entity
    return {
      [Node.getUuid(rootNode)]: {
        [Validator.keys.fields]: {
          [validationFields.recordKeys]: {
            [Validator.keys.errors]: [errorKeys.duplicateRecord],
            [Validator.keys.valid]: false
          }
        }
      }
    }
  }
}

module.exports = {
  validateRecordKeysUniqueness,
  validateEntityKeysUniqueness
}