import camelize from 'camelize'

import * as Validation from '../../../../../core/validation/validation'

// transforms a row of the record table into a record (with only the validation counts if includeValidationFields is false)
const recordTransformCallback =
  (surveyId: number, includeValidationFields = true) =>
  (record: Record<string, any>): Record<string, any> => {
    const validation = Validation.getValidation(record)

    return {
      ...camelize(Validation.dissocValidation(record)),
      surveyId,
      [Validation.keys.validation]: includeValidationFields
        ? validation
        : {
            ...Validation.newInstance(Validation.isValid(validation)),
            [Validation.keys.counts]: Validation.getCounts(validation),
          },
    }
  }

export default recordTransformCallback
