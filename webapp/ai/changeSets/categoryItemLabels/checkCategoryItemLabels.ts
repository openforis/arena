/**
 * Preview checks of category item label operations. The items themselves are checked by the server at Apply: the
 * browser does not hold the items of large categories.
 */
import * as Survey from '@core/survey/survey'

import type { ChangeSet, ChangeSetIssue } from '../types'
import { getCategoryItemLabelKey, isCategoryItemLabelOperation, type CategoryItemLabelSetOperation } from './types'

type Translate = (key: string, params?: Record<string, unknown>) => string
type FieldIssue = { field: string; message: string }

/**
 * Checks one operation: its category exists, its language is a survey language, its label is not set twice.
 * @param {object} params - Parameters.
 * @param {CategoryItemLabelSetOperation} params.op - Operation.
 * @param {object} params.survey - Survey.
 * @param {string[]} params.languages - Survey languages.
 * @param {Set<string>} params.seenKeys - Labels of the earlier operations (updated).
 * @param {Translate} params.t - Translator.
 * @returns {FieldIssue[]} The issues.
 */
const checkOperation = ({
  op,
  survey,
  languages,
  seenKeys,
  t,
}: {
  op: CategoryItemLabelSetOperation
  survey: any
  languages: string[]
  seenKeys: Set<string>
  t: Translate
}): FieldIssue[] => {
  if (!Survey.getCategoryByUuid(op.categoryUuid)(survey)) {
    return [{ field: 'categoryUuid', message: t('aiAssistant.issues.categoryNotFound', { name: op.categoryUuid }) }]
  }
  const field = `labels.${op.lang}`
  if (!languages.includes(op.lang)) {
    return [{ field, message: t('aiAssistant.issues.languageNotInSurvey', { lang: op.lang }) }]
  }
  const key = getCategoryItemLabelKey(op)
  if (seenKeys.has(key)) return [{ field, message: t('aiAssistant.issues.duplicateOperation', { name: op.ref }) }]
  seenKeys.add(key)
  return []
}

/**
 * Returns the issues of the category item label operations of a change set.
 * @param {ChangeSet} changeSet - Change set.
 * @param {object} survey - Draft survey.
 * @param {Translate} t - Translator.
 * @returns {ChangeSetIssue[]} The issues (operation = index in the change set).
 */
export const checkCategoryItemLabels = (changeSet: ChangeSet, survey: any, t: Translate): ChangeSetIssue[] => {
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]
  const seenKeys = new Set<string>()
  const issues: ChangeSetIssue[] = []
  for (const [index, op] of changeSet.operations.entries()) {
    if (!isCategoryItemLabelOperation(op)) continue
    const opIssues = checkOperation({ op, survey, languages, seenKeys, t })
    issues.push(...opIssues.map((opIssue) => ({ operation: index, ...opIssue })))
  }
  return issues
}
