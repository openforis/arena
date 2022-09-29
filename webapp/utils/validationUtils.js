import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

const getErrorText = (i18n) => (error) =>
  ValidationResult.hasMessages(error)
    ? ValidationResult.getMessage(i18n.language)(error)
    : i18n.t(ValidationResult.getKey(error), ValidationResult.getParams(error))

const getValidationErrorMessages = (i18n) => (validation) =>
  R.pipe(Validation.getErrors, R.concat(Validation.getWarnings(validation)), R.map(getErrorText(i18n)))(validation)

const getValidationFieldErrorMessage = (i18n, field) =>
  R.pipe(
    getValidationErrorMessages(i18n),
    R.ifElse(
      R.isEmpty,
      () =>
        getErrorText(i18n)(
          ValidationResult.newInstance(
            Validation.messageKeys.invalidField, // Default error message
            { field }
          )
        ),
      R.join(', ')
    )
  )

export const getValidationFieldMessages =
  (i18n, showKeys = true) =>
  (validation) =>
    R.pipe(
      // Extract invalid fields error messages
      Validation.getFieldValidations,
      Object.entries,
      R.map(
        ([field, fieldValidation]) =>
          `${showKeys ? `${i18n.t(field)}: ` : ''}${getValidationFieldErrorMessage(i18n, field)(fieldValidation)}`
      ),
      // Prepend validation error messages
      (messages) => R.pipe(getValidationErrorMessages(i18n), R.concat(messages))(validation)
    )(validation)
