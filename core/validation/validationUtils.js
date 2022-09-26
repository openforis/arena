import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as RecordValidation from '@core/record/recordValidation'

const getValidationCountErrorText = (survey, i18n) => (validationResult) => {
  const nodeDef = Survey.getNodeDefByUuid(ValidationResult.getParams(validationResult).nodeDefUuid)(survey)
  const nodeDefName = NodeDef.getLabel(nodeDef, i18n.language)
  return i18n.t(ValidationResult.getKey(validationResult), {
    ...ValidationResult.getParams(validationResult),
    nodeDefName,
  })
}

const getErrorText = (survey, i18n) => (validationResult) =>
  ValidationResult.hasMessages(validationResult)
    ? ValidationResult.getMessage(i18n.language)(validationResult)
    : RecordValidation.isValidationResultErrorCount(validationResult)
    ? getValidationCountErrorText(survey, i18n)(validationResult)
    : i18n.t(ValidationResult.getKey(validationResult), ValidationResult.getParams(validationResult))

const getMessages = (survey, fn, severity) => (i18n) =>
  R.pipe(fn, R.map(getErrorText(survey, i18n)), R.join(', '), (text) => (text ? { severity, text } : []))

const getValidationErrorMessages = (survey, i18n) =>
  R.converge(R.concat, [
    getMessages(survey, Validation.getWarnings, ValidationResult.severity.warning)(i18n),
    getMessages(survey, Validation.getErrors, ValidationResult.severity.error)(i18n),
  ])

const getValidationFieldErrorMessage = (survey, field, i18n) =>
  R.pipe(
    getValidationErrorMessages(survey, i18n),
    R.when(R.isEmpty, () =>
      getErrorText(
        survey,
        i18n
      )(
        ValidationResult.newInstance(
          Validation.messageKeys.invalidField, // Default error message
          { field }
        )
      )
    )
  )

const getValidationFieldMessages =
  ({ i18n, survey, showKeys = true }) =>
  (validation) => {
    const messages = [] // Every message is an object of type {severity, text}

    // Add messages from fields
    R.pipe(
      Validation.getFieldValidations,
      Object.entries,
      // Extract invalid fields error messages
      R.forEach(([field, childValidation]) => {
        const [severity, message] = getValidationFieldErrorMessage(survey, field, i18n)(childValidation)
        messages.push({ severity, text: `${showKeys ? `${i18n.t(field)}: ` : ''}${message}` })
      })
    )(validation)

    // Add messages from validation errors and warnings
    R.pipe(
      getValidationErrorMessages(survey, i18n),
      R.unless(R.isEmpty, (message) => messages.push(message))
    )(validation)

    return messages
  }

export const ValidationUtils = {
  getValidationFieldMessages,
}
