import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { MessageTypeFilterCategories } from '@core/validation/messageTypeFilterCategories'
import { ValidationUtils } from '@core/validation/validationUtils'

export type CleaningI18n = {
  language: string
  t: (key: string, params?: Record<string, unknown>) => string
  exists: (key: string) => boolean
}

export type ValidationResultEntry = { key: string; severity: 'error' | 'warning' }

export const OTHER_CATEGORY = 'other'

/**
 * Returns the validation report filter category of a message key.
 * @param {string} key - Validation message key.
 * @returns {string} The category id, or 'other'.
 */
export const getMessageCategoryId = (key: string): string => {
  for (const [categoryId, { messageKeys }] of Object.entries(MessageTypeFilterCategories)) {
    if (messageKeys.includes(key)) return categoryId
  }
  return OTHER_CATEGORY
}

/**
 * Collects the errors and warnings of a validation and of its fields.
 * @param {object} validation - The validation.
 * @returns {ValidationResultEntry[]} Key and severity of each result.
 */
export const collectValidationResults = (validation: any): ValidationResultEntry[] => {
  if (!validation) return []
  const results: ValidationResultEntry[] = [
    ...Validation.getErrors(validation).map((result: any) => ({
      key: ValidationResult.getKey(result),
      severity: 'error' as const,
    })),
    ...Validation.getWarnings(validation).map((result: any) => ({
      key: ValidationResult.getKey(result),
      severity: 'warning' as const,
    })),
  ]
  for (const fieldValidation of Object.values(Validation.getFieldValidations(validation) ?? {})) {
    results.push(...collectValidationResults(fieldValidation))
  }
  return results
}

/**
 * Returns the record keys of a report row, as text.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.row - The report row.
 * @returns {string} The key values, comma separated.
 */
export const getRowRecordKeys = ({ survey, row }: { survey: any; row: any }): string => {
  const nodeDef = RecordValidationReportItem.getNodeDef(survey)(row)
  const rootKeys = nodeDef && NodeDef.isRoot(nodeDef) ? row.keysSelf : row.keysHierarchy?.[0]?.keys
  return Object.values(rootKeys ?? {}).join(', ')
}

/**
 * Returns the path of the definition a report row is about (the counted child for count errors), by names.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.row - The report row.
 * @returns {string} The path, e.g. cluster/plot/tree/dbh.
 */
export const getRowNodeDefPath = ({ survey, row }: { survey: any; row: any }): string => {
  const nodeDef = Survey.getNodeDefByUuid(RecordValidationReportItem.getNodeDefContextUuid(row))(survey)
  return nodeDef ? Survey.getNodeDefPath({ nodeDef, separator: '/' })(survey) : ''
}

/**
 * Returns the translated messages of a report row.
 * @param {object} params - Parameters.
 * @param {CleaningI18n} params.i18n - Translator.
 * @param {object} params.survey - The survey.
 * @param {object} params.row - The report row.
 * @returns {string[]} The messages.
 */
export const getRowMessages = ({ i18n, survey, row }: { i18n: CleaningI18n; survey: any; row: any }): string[] =>
  ValidationUtils.getJointMessages({ i18n, survey, showKeys: false })(
    RecordValidationReportItem.getValidation(row)
  ).map(({ text }) => text.trim())
