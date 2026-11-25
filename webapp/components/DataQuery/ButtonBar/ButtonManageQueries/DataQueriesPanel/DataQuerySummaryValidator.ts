import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

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
