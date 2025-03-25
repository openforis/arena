import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

const validate = async ({ dataQuerySummary, dataQuerySummaries }) =>
  Validator.validate(dataQuerySummary, {
    ['props.name']: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(dataQuerySummaries),
    ],
  })

export const DataQuerySummaryValidator = {
  validate,
}
