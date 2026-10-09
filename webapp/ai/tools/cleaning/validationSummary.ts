import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'

import {
  CleaningI18n,
  collectValidationResults,
  getMessageCategoryId,
  getRowMessages,
  getRowNodeDefPath,
  getRowRecordKeys,
} from './validationRows'

type SummaryGroup = {
  path: string
  category: string
  severity: 'error' | 'warning'
  count: number
  recordCount: number
  example: { recordKeys: string; message: string }
}

/**
 * Groups validation report rows by attribute path, message category and severity.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object[]} params.rows - The rows analysed (at most 1,000).
 * @param {number} params.total - Number of rows of the whole report.
 * @param {CleaningI18n} params.i18n - Translator (for the example messages).
 * @param {string} params.cycle - Cycle key.
 * @returns {object} The summary.
 */
export const summarizeValidationRows = ({
  survey,
  rows,
  total,
  i18n,
  cycle,
}: {
  survey: any
  rows: any[]
  total: number
  i18n: CleaningI18n
  cycle: string
}) => {
  const groups = new Map<string, SummaryGroup & { recordUuids: Set<string> }>()
  for (const row of rows) {
    const path = getRowNodeDefPath({ survey, row })
    const seenInRow = new Set<string>()
    for (const { key, severity } of collectValidationResults(RecordValidationReportItem.getValidation(row))) {
      const category = getMessageCategoryId(key)
      const groupKey = `${path}|${category}|${severity}`
      if (seenInRow.has(groupKey)) continue
      seenInRow.add(groupKey)
      let group = groups.get(groupKey)
      if (!group) {
        const message = getRowMessages({ i18n, survey, row })[0] ?? key
        group = {
          path,
          category,
          severity,
          count: 0,
          recordCount: 0,
          recordUuids: new Set(),
          example: { recordKeys: getRowRecordKeys({ survey, row }), message },
        }
        groups.set(groupKey, group)
      }
      group.count += 1
      group.recordUuids.add(RecordValidationReportItem.getRecordUuid(row))
    }
  }
  const sortedGroups = [...groups.values()]
    .map(({ recordUuids, ...group }) => ({ ...group, recordCount: recordUuids.size }))
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
  return { cycle, total, analysedRows: rows.length, truncated: total > rows.length, groups: sortedGroups }
}
