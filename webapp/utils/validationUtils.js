import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

const getErrorText = (i18n) => (error) =>
  ValidationResult.hasMessages(error)
    ? ValidationResult.getMessage(i18n.language)(error)
    : i18n.t(ValidationResult.getKey(error), ValidationResult.getParams(error))

const getValidationErrorMessages = (i18n) => (validation) =>
  A.pipe(Validation.getErrors, A.concat(Validation.getWarnings(validation)), A.map(getErrorText(i18n)))(validation)

const getValidationFieldErrorMessage = (i18n, field) =>
  A.pipe(
    getValidationErrorMessages(i18n),
    A.ifElse(
      A.isEmpty,
      () =>
        getErrorText(i18n)(
          ValidationResult.newInstance(
            Validation.messageKeys.invalidField, // Default error message
            { field }
          )
        ),
      A.join(', ')
    )
  )

export const getValidationFieldMessages =
  (i18n, showKeys = true) =>
  (validation) =>
    A.pipe(
      // Extract invalid fields error messages
      Validation.getFieldValidations,
      Object.entries,
      A.map(
        ([field, fieldValidation]) =>
          `${showKeys ? `${i18n.t(field)}: ` : ''}${getValidationFieldErrorMessage(i18n, field)(fieldValidation)}`
      ),
      // Prepend validation error messages
      (messages) => A.pipe(getValidationErrorMessages(i18n), A.concat(messages))(validation)
    )(validation)
