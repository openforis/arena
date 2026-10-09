import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'

import { createRecordGetValuesTool } from '@webapp/ai/tools/cleaning/recordGetValuesTool'
import { findRecordUuidByKeys } from '@webapp/ai/tools/cleaning/recordLookup'
import { getRecordValues } from '@webapp/ai/tools/cleaning/recordValues'

import {
  cleaningTestRecord,
  cleaningTestSurvey,
  fakeI18n,
  newCleaningToolContext,
  newFakeCleaningApi,
  runTool,
} from '@test/unit/utils/aiCleaningTestUtils'

let survey: any
let record: any
let dbhDef: any
const cycle = Survey.cycleOneKey

const summaries = [
  { uuid: 'r-12', keysObj: { cluster_id: 12 } },
  { uuid: 'r-120', keysObj: { cluster_id: 120 } },
]

beforeAll(async () => {
  survey = await cleaningTestSurvey()
  record = cleaningTestRecord({ survey })
  dbhDef = Survey.getNodeDefByName('dbh')(survey)
})

describe('getRecordValues', () => {
  test('returns uuid, parent keys, formatted and raw value of each node', () => {
    const result = getRecordValues({ survey, cycle, record, nodeDefs: [dbhDef], i18n: fakeI18n })
    expect(result.recordKeys).toBe('12')
    expect(result.total).toBe(Record.getNodesByDefUuid(NodeDef.getUuid(dbhDef))(record).length)
    expect(result.truncated).toBe(false)
    expect(result.nodes[0]).toMatchObject({
      attribute: 'dbh',
      parentKeys: 'cluster[12] / plot[1] / tree[1]',
      raw: 7,
      validation: [],
    })
    expect(typeof result.nodes[0].formatted).toBe('string')
    expect(typeof result.nodes[0].nodeUuid).toBe('string')
  })

  test('is capped', () => {
    const result = getRecordValues({ survey, cycle, record, nodeDefs: [dbhDef], i18n: fakeI18n, max: 3 })
    expect(result.nodes).toHaveLength(3)
    expect(result.truncated).toBe(true)
    expect(result.total).toBeGreaterThan(3)
  })

  test('the default cap is 100 nodes', () => {
    const manyDefs = Array.from({ length: 60 }, () => dbhDef)
    const result = getRecordValues({ survey, cycle, record, nodeDefs: manyDefs, i18n: fakeI18n })
    expect(result.total).toBeGreaterThan(100)
    expect(result.nodes).toHaveLength(100)
    expect(result.truncated).toBe(true)
  })
})

describe('findRecordUuidByKeys', () => {
  const lookup = (keys: Record<string, unknown>, list = summaries) => {
    const { api, calls } = newFakeCleaningApi({ searchRecordsSummary: () => list })
    return { calls, result: findRecordUuidByKeys({ api, survey, surveyId: 1, cycle, keys }) }
  }

  test('matches the key values exactly, not by substring', async () => {
    const { calls, result } = lookup({ cluster_id: '12' })
    expect(await result).toEqual({ recordUuid: 'r-12' })
    expect(calls[0].params).toMatchObject({ surveyId: 1, cycle, search: '12', limit: 100, offset: 0 })
  })

  test('refuses names that are not the record keys', async () => {
    expect(await lookup({ plot_id: '1' }).result).toMatchObject({ error: { code: 'recordKeysInvalid' } })
    expect(await lookup({}).result).toMatchObject({ error: { code: 'recordKeysInvalid' } })
  })

  describe('paging', () => {
    const fullPage = (prefix: string) =>
      Array.from({ length: 100 }, (_, index) => ({ uuid: `${prefix}${index}`, keysObj: { cluster_id: 1000 + index } }))
    const pagedApi = (pages: any[][]) =>
      newFakeCleaningApi({ searchRecordsSummary: ({ offset }) => pages[offset / 100] ?? [] })

    test('finds an exact match on the second page', async () => {
      const { api } = pagedApi([fullPage('a'), [summaries[0]]])
      expect(await findRecordUuidByKeys({ api, survey, surveyId: 1, cycle, keys: { cluster_id: '12' } })).toEqual({
        recordUuid: 'r-12',
      })
    })

    test('a duplicate on the second page is ambiguous', async () => {
      const { api } = pagedApi([[summaries[0], ...fullPage('a').slice(1)], [{ ...summaries[0], uuid: 'dup' }]])
      expect(await findRecordUuidByKeys({ api, survey, surveyId: 1, cycle, keys: { cluster_id: '12' } })).toMatchObject(
        {
          error: { code: 'recordAmbiguous' },
        }
      )
    })

    test('stops at the page cap with recordSearchTooBroad', async () => {
      const { api, calls } = pagedApi([1, 2, 3, 4, 5, 6].map((n) => fullPage(`p${n}`)))
      expect(await findRecordUuidByKeys({ api, survey, surveyId: 1, cycle, keys: { cluster_id: '12' } })).toMatchObject(
        {
          error: { code: 'recordSearchTooBroad' },
        }
      )
      expect(calls).toHaveLength(5)
    })
  })

  test('not found and ambiguous', async () => {
    expect(await lookup({ cluster_id: '7' }).result).toMatchObject({ error: { code: 'recordNotFound' } })
    const duplicates = [summaries[0], { ...summaries[0], uuid: 'r-12-bis' }]
    expect(await lookup({ cluster_id: '12' }, duplicates).result).toMatchObject({ error: { code: 'recordAmbiguous' } })
  })
})

describe('record_getValues tool', () => {
  test('finds the record by its keys and reads the values', async () => {
    const { api, calls } = newFakeCleaningApi({
      searchRecordsSummary: () => summaries,
      fetchRecordAndNodes: () => record,
    })
    const tool = createRecordGetValuesTool({ api, getI18n: () => fakeI18n })
    expect(tool).toMatchObject({ name: 'record_getValues', dataClass: 'data', effect: 'read', area: ['cleaning'] })
    const result = await runTool(
      tool,
      { recordKeys: { cluster_id: '12' }, attributes: ['dbh'] },
      newCleaningToolContext({ survey })
    )
    expect(calls.find((call) => call.name === 'fetchRecordAndNodes')?.params).toEqual({
      surveyId: 1,
      recordUuid: 'r-12',
      signal: expect.any(AbortSignal),
    })
    expect(result.nodes.length).toBeGreaterThan(0)
  })

  test('errors: no record, unknown attribute, record not available', async () => {
    const { api } = newFakeCleaningApi({ fetchRecordAndNodes: () => null })
    const tool = createRecordGetValuesTool({ api, getI18n: () => fakeI18n })
    const ctx = newCleaningToolContext({ survey })
    expect(await runTool(tool, { attributes: ['dbh'] }, ctx)).toMatchObject({ error: { code: 'recordRequired' } })
    expect(await runTool(tool, { recordUuid: 'r', attributes: ['nope'] }, ctx)).toMatchObject({
      error: { code: 'unknownAttribute' },
    })
    expect(await runTool(tool, { recordUuid: 'r', attributes: ['dbh'] }, ctx)).toMatchObject({
      error: { code: 'recordNotAvailable' },
    })
  })
})
