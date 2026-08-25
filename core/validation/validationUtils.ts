import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as RecordValidation from '@core/record/recordValidation'
import { LanguageCode, ValidationSeverity } from '@openforis/arena-core'

interface I18n {
  language: string
  t: (key: string, params?: Record<string, unknown>) => string
  exists: (key: string) => boolean
}

const getValidationCountErrorText =
  ({ survey, i18n }: { survey: unknown; i18n: I18n }) =>
  (validationResult: ValidationResult.ValidationResultInstance): string => {
    const nodeDef = Survey.getNodeDefByUuid(
      (ValidationResult.getParams(validationResult) as { nodeDefUuid?: string }).nodeDefUuid
    )(survey)
    const nodeDefName = NodeDef.getLabel(nodeDef, i18n.language)
    return i18n.t(ValidationResult.getKey(validationResult), {
      ...ValidationResult.getParams(validationResult),
      nodeDefName,
    })
  }

const getValidationText =
  ({ survey, i18n }: { survey: unknown; i18n: I18n }) =>
  (validationResult: ValidationResult.ValidationResultInstance): string => {
    if (ValidationResult.hasMessages(validationResult)) {
      return ValidationResult.getMessage(i18n.language as LanguageCode)(validationResult)
    }
    if (RecordValidation.isValidationResultErrorCount(validationResult)) {
      return getValidationCountErrorText({ survey, i18n })(validationResult)
    }
    let key = ValidationResult.getKey(validationResult)
    if (!i18n.exists(key)) {
      key = StringUtils.prependIfMissing('common.')(key)
    }
    return i18n.t(key, ValidationResult.getParams(validationResult))
  }

const getJointText =
  ({
    i18n,
    survey,
    getterFn,
  }: {
    i18n: I18n
    survey: unknown
    getterFn: (v: Validation.ValidationInstance) => ValidationResult.ValidationResultInstance[]
  }) =>
  (validation: Validation.ValidationInstance): string =>
    getterFn(validation).map(getValidationText({ survey, i18n })).join(', ')

const getValidationMessage =
  ({ survey, i18n }: { survey: unknown; i18n: I18n }) =>
  (validation: Validation.ValidationInstance): { severity: ValidationResult.Severity; text: string } | null => {
    const errorText = getJointText({ i18n, survey, getterFn: Validation.getErrors })(validation)

    if (errorText) {
      return { severity: ValidationSeverity.error, text: errorText }
    }

    const warningText = getJointText({ i18n, survey, getterFn: Validation.getWarnings })(validation)

    if (warningText) {
      return { severity: ValidationSeverity.warning, text: warningText }
    }
    return null
  }

const getFieldValidationMessage =
  ({ survey, field, i18n }: { survey: unknown; field: string; i18n: I18n }) =>
  (validation: Validation.ValidationInstance): { severity: ValidationResult.Severity; text: string } => {
    const message = getValidationMessage({ survey, i18n })(validation)
    if (message) {
      return message
    }
    return {
      severity: ValidationSeverity.error,
      text: getValidationText({ survey, i18n })(
        ValidationResult.newInstance(
          Validation.messageKeys.invalidField, // Default error message
          { field }
        )
      ),
    }
  }

// A well-formed fields-map only ever holds nested Validation instances ({ valid, errors, warnings,
// fields }) - a "key" property directly on the map itself means it's actually a bare ValidationResult
// ({ key, params }) sitting where a fields-map was expected (e.g. a job error persisted without going
// through Job.addError's { error: { valid, errors: [...] } } wrapping). Detect that and normalize it
// under a synthetic "error" field, matching the addError convention, instead of iterating the
// ValidationResult's own "key"/"params" properties as if they were field names.
const isBareValidationResult = (fields: ReturnType<typeof Validation.getFieldValidations>): boolean =>
  typeof (fields as unknown as ValidationResult.ValidationResultInstance)?.[ValidationResult.keys.key] === 'string'

const getNormalizedFieldValidations = (
  validation: Validation.ValidationInstance
): ReturnType<typeof Validation.getFieldValidations> => {
  const fields = Validation.getFieldValidations(validation)
  if (isBareValidationResult(fields)) {
    return {
      error: Validation.newInstance(false, {}, [fields as unknown as ValidationResult.ValidationResultInstance]),
    }
  }
  return fields
}

const getJointMessages =
  ({ i18n, survey, showKeys = true }: { i18n: I18n; survey: unknown; showKeys?: boolean }) =>
  (validation: Validation.ValidationInstance): { severity: ValidationResult.Severity; text: string }[] => {
    const messages: { severity: ValidationResult.Severity; text: string }[] = []

    // Add messages from fields
    Object.entries(getNormalizedFieldValidations(validation)).forEach(([field, childValidation]) => {
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
  ({
    i18n,
    survey,
    showKeys = true,
    severity = null,
  }: {
    i18n: I18n
    survey: unknown
    showKeys?: boolean
    severity?: ValidationResult.Severity | null
  }) =>
  (validation: Validation.ValidationInstance): string => {
    const messages = getJointMessages({ i18n, survey, showKeys })(validation)
    const messagesFiltered = severity ? messages.filter((message) => message.severity === severity) : messages
    return messagesFiltered.map(({ text }) => text.trim()).join(', ')
  }

export const ValidationUtils = {
  getJointMessages,
  getJointMessage,
}
