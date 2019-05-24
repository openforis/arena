const R = require('ramda')

const Record = require('./record')
const Validator = require('../validation/validator')

const CountValidator = require('./_recordValidator/countValidator')
const AttributeValidator = require('./_recordValidator/attributeValidator')
const EntityUniquenessValidator = require('./_recordValidator/entityUniquenessValidator')

const validateNodes = async (survey, record, nodes) => {


  // 1. validate self and dependent attributes (validations/expressions)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes(survey, record, nodes)

  // 3. validate entity keys uniqueness
  const entityKeysValidations = EntityUniquenessValidator.validateEntitiesUniquenessInNodes(survey, record, nodes)

  // 4. merge validations
  const validation = {
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(attributeValidations)
  }

  return Validator.recalculateValidity(validation)
}

const validateRecord = async (survey, record) => {
  const nodes = Record.getNodes(record)

  // 1. validate self and dependent attributes (validations/expressions)
  console.log(`${new Date().getTime()} - validate attributes start`)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)
  console.log(`${new Date().getTime()} - validate attributes end`)

  // 2. validate min/max count
  console.log(`${new Date().getTime()} - validate children count start`)
  const nodeCountValidations = CountValidator.validateChildrenCountRecord(survey, record)
  console.log(`${new Date().getTime()} - validate children count end`)

  // 3. validate entity keys uniqueness
  console.log(`${new Date().getTime()} - validate entities uniqueness start`)
  const entityKeysValidations = EntityUniquenessValidator.validateEntitiesUniquenessInRecord(survey, record)
  console.log(`${new Date().getTime()} - validate entities uniqueness end`)

  // 4. merge validations
  console.log(`${new Date().getTime()} - merge validation start`)
  const validation = {
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(attributeValidations)
  }
  console.log(`${new Date().getTime()} - merge validation end`)

  return Validator.recalculateValidity(validation)
}

module.exports = {
  validateNodes,
  validateRecord
}