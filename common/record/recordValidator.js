const R = require('ramda')

const Validator = require('../validation/validator')

const CountValidator = require('./_recordValidator/countValidator')
const AttributeValidator = require('./_recordValidator/attributeValidator')
const EntityUniquenessValidator = require('./_recordValidator/entityUniquenessValidator')

const validateNodes = async (survey, record, nodes) => {

  // 1. validate self and dependent attributes (validations/expressions)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCount(survey, record, nodes)

  // 3. validate entity keys uniqueness
  const entityKeysValidations = EntityUniquenessValidator.validateEntitiesUniqueness(survey, record, nodes)

  // 4. merge validations
  const validation = {
    [Validator.keys.fields]: R.pipe(
      R.mergeDeepLeft(nodeCountValidations),
      R.mergeDeepLeft(entityKeysValidations)
    )(attributeValidations)
  }

  return Validator.recalculateValidity(validation)
}

module.exports = {
  validateNodes
}