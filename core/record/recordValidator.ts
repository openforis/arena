import Validation from '../validation/validation';
import CountValidator from './_recordValidator/countValidator';
import AttributeValidator from './_recordValidator/attributeValidator';

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

export default {
  validateNodes,
  validateAttribute: AttributeValidator.validateAttribute,
  validateChildrenCount: CountValidator.validateChildrenCount
};
