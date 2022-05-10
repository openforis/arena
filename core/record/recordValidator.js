import * as Validation from '@core/validation/validation'

import * as CountValidator from './_recordValidator/countValidator'
import * as AttributeValidator from './_recordValidator/attributeValidator'

export const validateNodes = async ({ survey, record, nodes }) => {
  // 1. validate self and dependent attributes (validations/expressions)
  const attributeValidations = await AttributeValidator.validateSelfAndDependentAttributes(survey, record, nodes)

  // 2. validate min/max count
  const nodeCountValidations = CountValidator.validateChildrenCountNodes(survey, record, nodes)

  // 3. merge validations
  return Validation.recalculateValidity(
    Validation.newInstance(true, {
      ...attributeValidations,
      ...nodeCountValidations,
    })
  )
}
