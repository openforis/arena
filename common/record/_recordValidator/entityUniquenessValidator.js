const R = require('ramda')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')

const Record = require('../record')
const Node = require('../node')
const RecordValidation = require('../recordValidation')

const Validator = require('../../validation/validator')

const keysError = {
  duplicateEntity: 'duplicateEntity'
}

const validateEntitiesUniqueness = (survey, record, nodes) => {
  const updatedEntities = _getUpdatedEntitiesWithKeys(survey, record, nodes)

  const entityKeysValidationsArray = updatedEntities.map(
    entity => _validateEntity(survey, record, entity)
  )

  return R.pipe(
    R.flatten,
    R.mergeAll
  )(entityKeysValidationsArray)
}

const _getUpdatedEntitiesWithKeys = (survey, record, nodes) => {
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

const _validateEntity = (survey, record, nodeEntity) => {

  // 1. find all sibling entities

  const parentNode = Record.getParentNode(nodeEntity)(record)
  const siblingEntities = Record.getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(nodeEntity))(record)

  // 2. validate all sibling entities uniqueness

  const entityValidations = siblingEntities.map(
    siblingEntity => {
      const isDuplicate = _isEntityDuplicated(survey, record, siblingEntities, siblingEntity)

      // 3. return entityKeys validation for each sibling entity key attribute
      const keyNodes = Record.getEntityKeyNodes(survey, siblingEntity)(record)
      return keyNodes.map(
        keyNode => ({
          [Node.getUuid(keyNode)]: {
            [Validator.keys.fields]: {
              [RecordValidation.keys.entityKeys]: {
                [Validator.keys.errors]: isDuplicate ? [keysError.duplicateEntity] : [],
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

const _isEntityDuplicated = (survey, record, siblingEntitiesAndSelf, entity) => {
  // 1. skip current entity among all entities
  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, Node.getUuid(entity)), siblingEntitiesAndSelf)
  // 2. get key values
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

module.exports = {
  validateEntitiesUniqueness
}