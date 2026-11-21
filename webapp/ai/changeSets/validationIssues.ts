import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

type Translate = (key: string, params?: Record<string, unknown>) => string

export type NodeDefIssue = { field: string; severity: 'error' | 'warning'; message: string }

// a new entity without children is fine (the designer's gate)
const IGNORED_FIELDS = new Set(['children', 'keyAttributes'])

const translate = (result: any, t: Translate): string =>
  t(ValidationResult.getKey(result), ValidationResult.getParams(result) ?? {})

/**
 * Walks a validation and its field validations, with the dotted field path.
 * @param {object|null} validation - Validation.
 * @param {object} options - Options.
 * @param {Translate} options.t - Translator.
 * @param {Set<string>} options.ignoredFields - Top-level fields to skip.
 * @param {boolean} options.warnings - Whether to include warnings.
 * @param {string} [prefix] - Field path so far.
 * @returns {NodeDefIssue[]} The issues.
 */
const collectIssues = (
  validation: any,
  { t, ignoredFields, warnings }: { t: Translate; ignoredFields: Set<string>; warnings: boolean },
  prefix = ''
): NodeDefIssue[] => {
  if (!validation) return []
  const result: NodeDefIssue[] = Validation.getErrors(validation).map((error: any) => ({
    field: prefix,
    severity: 'error' as const,
    message: translate(error, t),
  }))
  if (warnings) {
    for (const warning of Validation.getWarnings(validation)) {
      result.push({ field: prefix, severity: 'warning', message: translate(warning, t) })
    }
  }
  for (const [field, fieldValidation] of Object.entries(Validation.getFieldValidations(validation))) {
    if (prefix === '' && ignoredFields.has(field)) continue
    const path = prefix ? `${prefix}.${field}` : field
    result.push(...collectIssues(fieldValidation, { t, ignoredFields, warnings }, path))
  }
  return result
}

/**
 * Collects the translated error messages of a validation, recursively, with the dotted field path.
 * @param {object|null} validation - Validation.
 * @param {Translate} t - Translator.
 * @returns {{field: string, message: string}[]} The messages.
 */
export const collectValidationIssues = (validation: any, t: Translate): { field: string; message: string }[] => {
  if (!validation || Validation.isValid(validation)) return []
  return collectIssues(validation, { t, ignoredFields: IGNORED_FIELDS, warnings: false }).map(({ field, message }) => ({
    field,
    message,
  }))
}

/**
 * Collects the errors and warnings of a stored node definition validation, as the designer shows them.
 * @param {object|null} validation - Node definition validation.
 * @param {Translate} t - Translator.
 * @returns {NodeDefIssue[]} The issues.
 */
export const collectNodeDefIssues = (validation: any, t: Translate): NodeDefIssue[] =>
  collectIssues(validation, { t, ignoredFields: new Set(), warnings: true })
