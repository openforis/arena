import * as camelize from 'camelize'

import * as Validation from '../../../../../core/validation/validation'

/**
 * Transforms the result row of a query on the record table into a Record object.
 *
 * @param {!number} surveyId - The ID of the survey.
 * @param {boolean} [includeValidationFields=true] - Whether to include all the Validation fields.
 * @returns {Record} - The record object.
 */
export default (surveyId, includeValidationFields = true) => (record) => {
  const { validation, ...rest } = record
  return {
    surveyId,
    ...camelize(rest),
    [Validation.keys.validation]: includeValidationFields
      ? validation
      : {
          ...Validation.newInstance(Validation.isValid(validation)),
          [Validation.keys.counts]: Validation.getCounts(validation),
        },
  }
}
