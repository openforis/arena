import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

type Translate = (key: string, params?: Record<string, unknown>) => string

// a new entity without children is fine (the designer's gate)
const IGNORED_FIELDS = new Set(['children', 'keyAttributes'])

/**
 * Collects the translated error messages of a validation, recursively, with the dotted field path.
 * @param {object|null} validation - Validation.
 * @param {Translate} t - Translator.
 * @param {string} [prefix] - Field path so far.
 * @returns {{field: string, message: string}[]} The messages.
 */
export const collectValidationIssues = (
  validation: any,
  t: Translate,
  prefix = ''
): { field: string; message: string }[] => {
  if (!validation || Validation.isValid(validation)) return []
  const result = Validation.getErrors(validation).map((error: any) => ({
    field: prefix,
    message: t(ValidationResult.getKey(error), ValidationResult.getParams(error) ?? {}),
  }))
  for (const [field, fieldValidation] of Object.entries(Validation.getFieldValidations(validation))) {
    if (prefix === '' && IGNORED_FIELDS.has(field)) continue
    result.push(...collectValidationIssues(fieldValidation, t, prefix ? `${prefix}.${field}` : field))
  }
  return result
}
