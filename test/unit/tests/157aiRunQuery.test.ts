import SystemError from '@core/systemError'
import * as Survey from '@core/survey/survey'

import { proposeQueryTool } from '@webapp/ai/tools/analysis/proposeQuery'
import { createRunQueryTools } from '@webapp/ai/tools/analysis/runQuery'
import { RESULT_MAX_CHARS } from '@webapp/ai/tools/analysis/toolResults'

import { newAnalysisToolContext, newFakeAnalysisApi, runTool } from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

let survey: any = null

const aggregateInput = {
  entity: 'tree',
  mode: 'aggregate',
  dimensions: ['tree_type'],
  measures: [{ attribute: 'dbh', functions: ['avg'] }],
  explanation: 'Average DBH by tree type',
}
const rawInput = { entity: 'tree', mode: 'raw', attributes: ['tree_id', 'tree_species'], explanation: 'Trees' }

const aggregateRow = (idx: number) => ({ tree_type: `T${idx}`, tree_type_label: `Type ${idx}`, dbh_avg: idx + 0.5 })
const rawRow = (idx: number, text = 'x') => ({
  _id: idx,
  record_uuid: `r${idx}`,
  tree_id: idx,
  tree_species: 'AFZ/QUA',
  tree_species_scientific_name: `Afzelia quanzensis ${text}`,
  tree_species_vernacular_name: null,
  dbh: 12.5,
})

/**
 * Proposes a query in a new context and returns the tools and the context.
 */
const setUp = async ({
  input = aggregateInput,
  rows = [],
  count = 0,
}: { input?: object; rows?: object[]; count?: number } = {}) => {
  const { api, calls } = newFakeAnalysisApi({ fetchQueryRows: () => rows, fetchQueryCount: () => count })
  const [countTool, runQueryTool] = createRunQueryTools({ api })
  const ctx = newAnalysisToolContext({ survey })
  await runTool(proposeQueryTool, input, ctx)
  return { countTool, runQueryTool, ctx, calls }
}

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('unknown queryId', () => {
  test.each([['q9'], ['q1 '], ['toString'], ['']])('refuses %p without any request', async (queryId) => {
    const { countTool, runQueryTool, ctx, calls } = await setUp()
    for (const tool of [countTool, runQueryTool]) {
      const result = await runTool(tool, { queryId }, ctx)
      expect(result.error.code).toBe('unknownQuery')
    }
    expect(calls).toHaveLength(0)
  })

  test('refuses an id proposed in another conversation', async () => {
    const { runQueryTool, calls } = await setUp()
    const otherConversation = newAnalysisToolContext({ survey })
    expect((await runTool(runQueryTool, { queryId: 'q1' }, otherConversation)).error.code).toBe('unknownQuery')
    expect(calls).toHaveLength(0)
  })

  test('refuses a free-form query', async () => {
    const { runQueryTool } = await setUp()
    expect(runQueryTool.inputSchema.safeParse({ query: { entityDefUuid: 'x' } }).success).toBe(false)
  })
})

describe('query_run', () => {
  test('aggregate: at most 200 groups, total from the count endpoint', async () => {
    const rows = Array.from({ length: 201 }, (_, idx) => aggregateRow(idx))
    const { runQueryTool, ctx, calls } = await setUp({ rows, count: 250 })
    const result = await runTool(runQueryTool, { queryId: 'q1' }, ctx)
    expect(calls[0]).toMatchObject({
      name: 'fetchQueryRows',
      params: { surveyId: Survey.getId(survey), cycle: Survey.cycleOneKey, limit: 201 },
    })
    expect(calls[1].name).toBe('fetchQueryCount')
    expect(result.columns).toEqual(['tree_type', 'tree_type_label', 'dbh_avg'])
    expect(result.rows).toHaveLength(200)
    expect(result.rows[3]).toEqual(['T3', 'Type 3', 3.5])
    expect(result).toMatchObject({ queryId: 'q1', mode: 'aggregate', total: 250, truncated: true })
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(RESULT_MAX_CHARS)
  })

  test('aggregate: few groups, no count request', async () => {
    const rows = [aggregateRow(1), aggregateRow(2), aggregateRow(3)]
    const { runQueryTool, ctx, calls } = await setUp({ rows })
    const result = await runTool(runQueryTool, { queryId: 'q1' }, ctx)
    expect(calls.map((call) => call.name)).toEqual(['fetchQueryRows'])
    expect(result).toMatchObject({ total: 3, truncated: false })
  })

  test('raw: 50 rows plus the total, label columns kept, other view columns dropped', async () => {
    const rows = Array.from({ length: 51 }, (_, idx) => rawRow(idx))
    const { runQueryTool, ctx, calls } = await setUp({ input: rawInput, rows, count: 60 })
    const result = await runTool(runQueryTool, { queryId: 'q1' }, ctx)
    expect(calls[0].params.limit).toBe(51)
    expect(result.columns).toEqual([
      'tree_id',
      'tree_species',
      'tree_species_scientific_name',
      'tree_species_vernacular_name',
    ])
    expect(result.rows).toHaveLength(50)
    expect(result.rows[0]).toEqual([0, 'AFZ/QUA', 'Afzelia quanzensis x', null])
    expect(result).toMatchObject({ total: 60, truncated: true })
  })

  test('raw: long values are cut to the JSON budget', async () => {
    const rows = Array.from({ length: 40 }, (_, idx) => rawRow(idx, 'y'.repeat(400)))
    const { runQueryTool, ctx } = await setUp({ input: rawInput, rows })
    const result = await runTool(runQueryTool, { queryId: 'q1' }, ctx)
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(RESULT_MAX_CHARS)
    expect(result.rows.length).toBeLessThan(40)
    expect(result).toMatchObject({ total: 40, truncated: true })
  })

  test('an empty result is not an error', async () => {
    const { runQueryTool, ctx } = await setUp({ rows: [] })
    expect(await runTool(runQueryTool, { queryId: 'q1' }, ctx)).toEqual({
      queryId: 'q1',
      mode: 'aggregate',
      columns: ['tree_type', 'tree_type_label', 'dbh_avg'],
      rows: [],
      total: 0,
      truncated: false,
    })
  })

  test('a timeout becomes queryTimeout with a hint; other errors are thrown', async () => {
    const timeout = newFakeAnalysisApi({ fetchQueryRows: () => Promise.reject(new SystemError('queryTimeout')) })
    const [, runQueryTool] = createRunQueryTools({ api: timeout.api })
    const ctx = newAnalysisToolContext({ survey })
    await runTool(proposeQueryTool, aggregateInput, ctx)
    const result = await runTool(runQueryTool, { queryId: 'q1' }, ctx)
    expect(result.error.code).toBe('queryTimeout')
    expect(result.error.message).toMatch(/filter/)

    const failure = new Error('boom')
    const broken = newFakeAnalysisApi({ fetchQueryRows: () => Promise.reject(failure) })
    const [, brokenRunTool] = createRunQueryTools({ api: broken.api })
    await expect(runTool(brokenRunTool, { queryId: 'q1' }, ctx)).rejects.toBe(failure)
  })
})

describe('query_count', () => {
  test('returns the count of a proposed query', async () => {
    const { countTool, ctx, calls } = await setUp({ count: 3 })
    expect(await runTool(countTool, { queryId: 'q1' }, ctx)).toEqual({ queryId: 'q1', mode: 'aggregate', total: 3 })
    expect(calls.map((call) => call.name)).toEqual(['fetchQueryCount'])
  })

  test('both tools are data read tools of the analysis area', async () => {
    const { countTool, runQueryTool } = await setUp()
    for (const tool of [countTool, runQueryTool]) {
      expect(tool).toMatchObject({ dataClass: 'data', effect: 'read', area: ['analysis'] })
    }
    expect([countTool.name, runQueryTool.name]).toEqual(['query_count', 'query_run'])
  })
})
