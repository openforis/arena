const R = require('ramda')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')

const Record = require('../record')
const Node = require('../node')
const RecordValidation = require('../recordValidation')

const Validator = require('../../validation/validator')

const validateEntitiesUniquenessInRecord = (survey, record) => {
  const entities = []
  const { root } = Survey.getHierarchy()(survey)
  Survey.traverseHierarchyItemSync(root, nodeDefEntity => {
    if (Survey.hasNodeDefKeys(nodeDefEntity)) {
      entities.push(...Record.getNodesByDefUuid(nodeDefEntity)(record))
    }
  })
  return _validateEntitiesUniqueness(survey, record, entities)
}

const validateEntitiesUniquenessInNodes = (survey, record, nodes) => {
  const updatedEntities = _getUpdatedEntitiesWithKeys(survey, record, nodes)
  return _validateEntitiesUniqueness(survey, record, updatedEntities)
}

const _validateEntitiesUniqueness = (survey, record, updatedEntities) => {
  const entityKeysValidationsArray = updatedEntities.map(
    entity => _validateEntity(survey, record, entity)
  )

  return R.pipe(
    R.flatten,
    R.mergeAll
  )(entityKeysValidationsArray)
}

const _getUpdatedEntitiesWithKeys = (survey, record, nodes) => {
  const entitiesUpdated = []

  R.forEachObjIndexed(node => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

      if (NodeDef.isEntity(nodeDef) && Survey.hasNodeDefKeys(nodeDef)(survey)) {
        // updated node is an entity with keys
        entitiesUpdated.push(node)
      } else {
        const parentDef = Survey.getNodeDefParent(nodeDef)(survey)

        if (NodeDef.isKey(nodeDef) &&
          !NodeDef.isRoot(parentDef) &&
          Survey.hasNodeDefKeys(parentDef)(survey)) {
          // updated node is the key of a non-root entity with keys
          const nodeParent = Record.getParentNode(node)(record)
          entitiesUpdated.push(nodeParent)
        }
      }
    },
    nodes
  )

  return entitiesUpdated
}

const _validateEntity = (survey, record, nodeEntity) => {

  // 1. find all sibling entities

  const parentNode = Record.getParentNode(nodeEntity)(record)
  const siblingEntitiesAndSelf = Record.getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(nodeEntity))(record)

  // 2. validate all sibling entities uniqueness

  const entityValidations = siblingEntitiesAndSelf.map(
    siblingEntity => {
      const isDuplicate = _isEntityDuplicated(survey, record, siblingEntitiesAndSelf, siblingEntity)

      // 3. return entity validation
      return {
        [Node.getUuid(siblingEntity)]: {
          [Validator.keys.fields]: {
            [RecordValidation.keys.entityKeys]: {
              [Validator.keys.errors]: isDuplicate ? [RecordValidation.keysError.duplicateEntity] : [],
              [Validator.keys.valid]: !isDuplicate
            }
          }
        }
      }
    }
  )
  return R.mergeAll(entityValidations)
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
  validateEntitiesUniquenessInNodes,
  validateEntitiesUniquenessInRecord,
}