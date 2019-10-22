const Validation = require('@core/validation/validation')

const CountValidator = require('./_recordValidator/countValidator')
const AttributeValidator = require('./_recordValidator/attributeValidator')

const validateNodes = async (survey, record, nodes) => {

  // 1. validate self and dependent attributes (validations/expressions)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes(survey, record, nodes)

  // 3. merge validations
  return Validation.recalculateValidity(
    Validation.newInstance(
      true,
      {
        ...attributeValidations,
        ...nodeCountValidations
      }
    )
  )
}

module.exports = {
  validateNodes,
  validateAttribute: AttributeValidator.validateAttribute,
  validateChildrenCount: CountValidator.validateChildrenCount
}