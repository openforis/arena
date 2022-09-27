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

const getValidationText =
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

const getJointText =
  ({ i18n, survey, getterFn }) =>
  (validation) =>
    getterFn(validation).map(getValidationText({ survey, i18n })).join(', ')

const getValidationMessage =
  ({ survey, i18n }) =>
  (validation) => {
    const errorText = getJointText({ i18n, survey, getterFn: Validation.getErrors })(validation)

    if (errorText) {
      return { severity: ValidationResult.severity.error, text: errorText }
    }

    const warningText = getJointText({ i18n, survey, getterFn: Validation.getWarnings })(validation)

    if (warningText) {
      return { severity: ValidationResult.severity.warning, text: warningText }
    }
    return null
  }

const getFieldValidationMessage =
  ({ survey, field, i18n }) =>
  (validation) => {
    const message = getValidationMessage({ survey, i18n })(validation)
    if (message) {
      return message
    }
    return {
      severity: ValidationResult.severity.error,
      text: getValidationText({ survey, i18n })(
        ValidationResult.newInstance(
          Validation.messageKeys.invalidField, // Default error message
          { field }
        )
      ),
    }
  }

const getJointMessages =
  ({ i18n, survey, showKeys = true }) =>
  (validation) => {
    const messages = [] // Every message is an object of type {severity, text}

    // Add messages from fields
    Object.entries(Validation.getFieldValidations(validation)).forEach(([field, childValidation]) => {
      const { severity, text } = getFieldValidationMessage({ survey, field, i18n })(childValidation)
      const textPrefix = showKeys ? `${i18n.t(field)}: ` : ''
      messages.push({ severity, text: `${textPrefix}${text}` })
    })

    // Add messages from validation errors and warnings
    const mainErrorMessage = getValidationMessage({ survey, i18n })(validation)
    if (mainErrorMessage) {
      messages.push(mainErrorMessage)
    }

    return messages
  }

const getJointMessage =
  ({ i18n, survey, showKeys = true, severity = null }) =>
  (validation) => {
    const messages = getJointMessages({ i18n, survey, showKeys })(validation)
    const messagesFiltered = severity ? messages.filter((message) => message.severity === severity) : messages
    return messagesFiltered.map(({ text }) => text).join(', ')
  }

export const ValidationUtils = {
  getJointMessages,
  getJointMessage,
}
