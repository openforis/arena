import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as RecordValidation from '@core/record/recordValidation'

const getValidationCountErrorText =
  ({ survey, i18n }) =>
  (validationResult) => {
    const nodeDef = Survey.getNodeDefByUuid(ValidationResult.getParams(validationResult).nodeDefUuid)(survey)
    const nodeDefName = NodeDef.getLabel(nodeDef, i18n.language)
    return i18n.t(ValidationResult.getKey(validationResult), {
      ...ValidationResult.getParams(validationResult),
      nodeDefName,
    })
  }

const getErrorText =
  ({ survey, i18n }) =>
  (validationResult) => {
    if (ValidationResult.hasMessages(validationResult)) {
      return ValidationResult.getMessage(i18n.language)(validationResult)
    }
    if (RecordValidation.isValidationResultErrorCount(validationResult)) {
      return getValidationCountErrorText({ survey, i18n })(validationResult)
    }
    return i18n.t(ValidationResult.getKey(validationResult), ValidationResult.getParams(validationResult))
  }

const getJointMessages =
  ({ i18n, survey, getterFn, severity }) =>
  (validation) => {
    const text = getterFn(validation).map(getErrorText({ survey, i18n })).join(', ')
    return text ? { severity, text } : null
  }

const getValidationErrorMessages =
  ({ survey, i18n }) =>
  (validation) => {
    const errors = getJointMessages({
      i18n,
      survey,
      getterFn: Validation.getErrors,
      severity: ValidationResult.severity.error,
    })(validation)

    if (errors) {
      return errors
    }

    const warnings = getJointMessages({
      i18n,
      survey,
      getterFn: Validation.getWarnings,
      severity: ValidationResult.severity.warning,
    })(validation)

    return warnings
  }

const getValidationFieldErrorMessage = ({ survey, field, i18n }) =>
  R.pipe(
    getValidationErrorMessages({ survey, i18n }),
    R.when(R.isEmpty, () => ({
      severity: ValidationResult.severity.error,
      text: getErrorText({ survey, i18n })(
        ValidationResult.newInstance(
          Validation.messageKeys.invalidField, // Default error message
          { field }
        )
      ),
    }))
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
        const { severity, text } = getValidationFieldErrorMessage({ survey, field, i18n })(childValidation)
        messages.push({ severity, text: `${showKeys ? `${i18n.t(field)}: ` : ''}${text}` })
      })
    )(validation)

    // Add messages from validation errors and warnings
    R.pipe(
      getValidationErrorMessages({ survey, i18n }),
      R.unless(R.isEmpty, (message) => messages.push(message))
    )(validation)

    return messages
  }

export const ValidationUtils = {
  getValidationFieldMessages,
}
