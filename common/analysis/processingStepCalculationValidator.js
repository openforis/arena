import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

export const validate = async calculation =>
  await Validator.validate(calculation, {
    [`${ProcessingStepCalculation.keys.nodeDefUuid}`]: [
      Validator.validateRequired(Validation.messageKeys.analysis.processingStepCalculation.attributeRequired),
    ],
  })
