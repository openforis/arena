import SystemError from '@core/systemError'

import { pageValidationRows, toValidationListItems } from '@webapp/ai/tools/cleaning/validationList'
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

const rowFor = (record: any, path: string, key = 'record.attribute.valueRequired') =>
  newValidationRow({
    survey,
    record,
    node: RecordUtils.findNodeByPath(path)(survey, record),
    validation: newValidation(key),
  })

const getListTool = (api: any) =>
  createValidationTools({ api, getI18n: () => fakeI18n }).find((tool) => tool.name === 'validation_list') as any

beforeAll(async () => {
  survey = await cleaningTestSurvey()
})

describe('toValidationListItems', () => {
  test('returns keys, path with entity keys, messages, step and node uuid', () => {
    const record = cleaningTestRecord({ survey })
    const row = rowFor(record, 'cluster/plot[0]/tree[1]/dbh')
    const [item] = toValidationListItems({
      survey,
      rows: [row],
      user: { uuid: 'admin', authGroups: [{ name: 'systemAdmin' }] },
      i18n: fakeI18n,
      lang: 'en',
    })
    expect(item).toMatchObject({
      recordUuid: row.recordUuid,
      recordKeys: '12',
      recordStep: '1',
      nodeUuid: row.nodeUuid,
      canEdit: true,
    })
    expect(item.path).toBe('cluster[12] / plot[1] / tree[2] / dbh')
    expect(item.messages).toEqual(['record.attribute.valueRequired'])
  })

  test('canEdit follows the record step and ownership', () => {
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    const editor = newCleaningSurveyUser({ survey, groupName: 'dataEditor', uuid: 'editor' })
    const entry = rowFor(cleaningTestRecord({ survey, step: '1', ownerUuid: 'someone' }), 'cluster/cluster_id')
    const analysis = rowFor(cleaningTestRecord({ survey, step: '3' }), 'cluster/cluster_id')
    const owned = rowFor(cleaningTestRecord({ survey, step: '1', ownerUuid: 'editor' }), 'cluster/cluster_id')
    const canEdit = (user: any, row: any) =>
      toValidationListItems({ survey, rows: [row], user, i18n: fakeI18n, lang: 'en' })[0].canEdit
    expect(canEdit(cleanser, entry)).toBe(true)
    expect(canEdit(cleanser, analysis)).toBe(false)
    expect(canEdit(editor, entry)).toBe(false)
    expect(canEdit(editor, owned)).toBe(true)
  })
})

describe('pageValidationRows', () => {
  test('51 fetched rows give 50 and more', () => {
    const page = pageValidationRows(Array.from({ length: 51 }, (_, index) => index))
    expect(page.rows).toHaveLength(50)
    expect(page.hasMore).toBe(true)
  })

  test('50 fetched rows give 50 and no more', () => {
    const page = pageValidationRows(Array.from({ length: 50 }, (_, index) => index))
    expect(page.rows).toHaveLength(50)
    expect(page.hasMore).toBe(false)
  })
})

describe('validation_list tool', () => {
  test('filters by attribute names, categories and record, at most 50 rows', async () => {
    const record = cleaningTestRecord({ survey })
    const rows = Array.from({ length: 51 }, () => rowFor(record, 'cluster/plot[0]/tree[0]/dbh'))
    const { api, calls } = newFakeCleaningApi({
      fetchValidationReportRows: () => rows,
      countValidationReportRows: () => 80,
    })
    const result = await runTool(
      getListTool(api),
      { attributes: ['dbh'], categories: ['valueRequired', 'uniqueDuplicate'], recordUuid: 'r-1' },
      newCleaningToolContext({ survey })
    )
    const fetchCall = calls.find((call) => call.name === 'fetchValidationReportRows')
    const dbhDefUuid = rows[0].nodeDefUuid
    expect(fetchCall?.params).toMatchObject({
      recordUuid: 'r-1',
      attributeDefUuids: [dbhDefUuid],
      messageTypeKeys: [
        'record.attribute.valueRequired',
        'record.attribute.uniqueDuplicate',
        'validationErrors:record.uniqueAttributeDuplicate',
      ],
      offset: 0,
      limit: 51,
    })
    // 50 is the cap; the 7,000-character budget may cut further
    expect(result.rows.length).toBeGreaterThan(0)
    expect(result.rows.length).toBeLessThanOrEqual(50)
    expect(result).toMatchObject({ total: 80, truncated: true })
    expect(result.nextOffset).toBe(result.rows.length)
  })

  test('unknown attribute names are refused without any request', async () => {
    const { api, calls } = newFakeCleaningApi()
    const result = await runTool(getListTool(api), { attributes: ['dbh', 'nope'] }, newCleaningToolContext({ survey }))
    expect(result).toEqual({ error: { code: 'unknownAttribute', message: expect.stringContaining('nope') } })
    expect(calls).toEqual([])
  })

  test('a timeout is reported as queryTimeout and the signal is passed to the API', async () => {
    const { api, calls } = newFakeCleaningApi({
      fetchValidationReportRows: () => {
        throw new SystemError('queryTimeout')
      },
    })
    const ctx = newCleaningToolContext({ survey })
    const result = await runTool(getListTool(api), {}, ctx)
    expect(result).toMatchObject({ error: { code: 'queryTimeout' } })
    expect(calls[0].params.signal).toBe(ctx.signal)
  })

  test('a forbidden report is reported as noPermission', async () => {
    const { api } = newFakeCleaningApi({
      fetchValidationReportRows: () => {
        throw Object.assign(new Error('Forbidden'), { response: { status: 403 } })
      },
    })
    const result = await runTool(getListTool(api), {}, newCleaningToolContext({ survey }))
    expect(result).toMatchObject({ error: { code: 'noPermission' } })
  })

  test('an unknown category is refused by the input schema', () => {
    const { api } = newFakeCleaningApi()
    expect(() => getListTool(api).inputSchema.parse({ categories: ['typo'] })).toThrow()
  })
})
