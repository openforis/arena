import * as Survey from '@core/survey/survey'

import { collectValidationResults, getMessageCategoryId } from '@webapp/ai/tools/cleaning/validationRows'
import { summarizeValidationRows } from '@webapp/ai/tools/cleaning/validationSummary'
import { createValidationTools } from '@webapp/ai/tools/cleaning/validationTools'

import {
  cleaningTestRecord,
  cleaningTestSurvey,
  fakeI18n,
  newCleaningSurveyUser,
  newCleaningToolContext,
  newFakeCleaningApi,
  newValidation,
  newValidationRow,
  runTool,
} from '@test/unit/utils/aiCleaningTestUtils'

import * as RecordUtils from '../../utils/recordUtils'

let survey: any
let record: any
let rows: any[]

const nodeAt = (path: string) => RecordUtils.findNodeByPath(path)(survey, record)

beforeAll(async () => {
  survey = await cleaningTestSurvey()
  record = cleaningTestRecord({ survey })
  rows = [
    newValidationRow({
      survey,
      record,
      node: nodeAt('cluster/plot[0]/tree[0]/dbh'),
      validation: newValidation('record.attribute.valueRequired'),
    }),
    newValidationRow({
      survey,
      record,
      node: nodeAt('cluster/plot[0]/tree[1]/dbh'),
      validation: newValidation('record.attribute.valueRequired'),
    }),
    newValidationRow({
      survey,
      record,
      node: nodeAt('cluster/plot[0]/tree[1]/tree_height'),
      validation: newValidation('record.attribute.customValidation', 'warning'),
    }),
    newValidationRow({
      survey,
      record,
      node: nodeAt('cluster/plot[1]/plot_id'),
      validation: newValidation('some.unknown.key'),
    }),
  ]
})

describe('validation rows', () => {
  test('message categories come from the report filter categories', () => {
    expect(getMessageCategoryId('record.attribute.valueRequired')).toBe('valueRequired')
    expect(getMessageCategoryId('validationErrors:record.uniqueAttributeDuplicate')).toBe('uniqueDuplicate')
    expect(getMessageCategoryId('record.nodes.count.minNotReached')).toBe('nodesCount')
    expect(getMessageCategoryId('anything.else')).toBe('other')
  })

  test('results are collected from the fields too', () => {
    const validation = {
      valid: false,
      errors: [{ key: 'a' }],
      warnings: [],
      fields: { child: { valid: false, errors: [], warnings: [{ key: 'b' }], fields: {} } },
    }
    expect(collectValidationResults(validation)).toEqual([
      { key: 'a', severity: 'error' },
      { key: 'b', severity: 'warning' },
    ])
  })
})

describe('summarizeValidationRows', () => {
  test('groups by attribute path, category and severity, counting rows and records', () => {
    const summary = summarizeValidationRows({ survey, rows, total: rows.length, i18n: fakeI18n, cycle: '0' })
    expect(summary.truncated).toBe(false)
    expect(summary.analysedRows).toBe(4)
    expect(summary.groups[0]).toMatchObject({
      path: 'cluster/plot/tree/dbh',
      category: 'valueRequired',
      severity: 'error',
      count: 2,
      recordCount: 1,
    })
    expect(summary.groups[0].example.recordKeys).toBe('12')
    expect(summary.groups.map((group: any) => [group.path, group.category, group.severity])).toEqual([
      ['cluster/plot/tree/dbh', 'valueRequired', 'error'],
      ['cluster/plot/plot_id', 'other', 'error'],
      ['cluster/plot/tree/tree_height', 'customValidation', 'warning'],
    ])
  })

  test('is truncated when the report has more rows than analysed', () => {
    const summary = summarizeValidationRows({ survey, rows, total: 1500, i18n: fakeI18n, cycle: '0' })
    expect(summary).toMatchObject({ total: 1500, analysedRows: 4, truncated: true })
  })
})

describe('validation_summarize tool', () => {
  const getTool = (api: any) =>
    createValidationTools({ api, getI18n: () => fakeI18n }).find((tool) => tool.name === 'validation_summarize') as any

  test('is a data read tool of the cleaning area for users who can cleanse records', () => {
    const { api } = newFakeCleaningApi()
    const tool = getTool(api)
    expect(tool).toMatchObject({ dataClass: 'data', effect: 'read', area: ['cleaning'] })
    expect(tool.requires(newCleaningToolContext({ survey }))).toBe(true)
    const dataEditor = newCleaningSurveyUser({ survey, groupName: 'dataEditor' })
    expect(tool.requires(newCleaningToolContext({ survey, user: dataEditor }))).toBe(false)
    expect(tool.requires(newCleaningToolContext({ survey: null }))).toBe(false)
  })

  test('fetches at most 1,000 rows of the current cycle and the total', async () => {
    const { api, calls } = newFakeCleaningApi({
      fetchValidationReportRows: () => rows,
      countValidationReportRows: () => 1200,
    })
    const result = await runTool(getTool(api), { recordUuid: 'r-1' }, newCleaningToolContext({ survey }))
    expect(calls.map((call) => call.name).sort()).toEqual(['countValidationReportRows', 'fetchValidationReportRows'])
    const fetchCall = calls.find((call) => call.name === 'fetchValidationReportRows')
    expect(fetchCall?.params).toMatchObject({
      surveyId: 1,
      cycle: Survey.cycleOneKey,
      recordUuid: 'r-1',
      offset: 0,
      limit: 1000,
    })
    expect(result).toMatchObject({ total: 1200, analysedRows: 4, truncated: true })
  })
})
