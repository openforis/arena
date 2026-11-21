import { z } from 'zod'

import { uuidv4 } from '@core/uuid'

import { runTool } from '@webapp/ai/tools/registry'
import { createRecordGetValuesTool } from '@webapp/ai/tools/cleaning/recordGetValuesTool'
import { createRecordsProposeEditsTool } from '@webapp/ai/tools/cleaning/recordsProposeEditsTool'
import { createValidationTools } from '@webapp/ai/tools/cleaning/validationTools'
import { RECORD_EDITS_MAX } from '@webapp/ai/changeSets/recordEdits/types'

import {
  cleaningTestSurvey,
  fakeI18n,
  newCleaningToolContext,
  newFakeCleaningApi,
} from '@test/unit/utils/aiCleaningTestUtils'

let survey: any

beforeAll(async () => {
  survey = await cleaningTestSurvey()
})

const edit = (overrides: Record<string, unknown> = {}) => ({
  recordUuid: uuidv4(),
  nodeUuid: uuidv4(),
  value: '1',
  ...overrides,
})

// the schemas are checked before any request: the fake API must stay untouched
const run = async (tool: any, calls: unknown[], input: unknown) => {
  const result: any = await runTool(tool, input, newCleaningToolContext({ survey }))
  expect(calls).toEqual([])
  return result
}

describe('records_proposeEdits input is bounded (382)', () => {
  const fake = newFakeCleaningApi()
  const tool: any = createRecordsProposeEditsTool({ api: fake.api, getI18n: () => fakeI18n })
  const refused = (input: unknown) => run(tool, fake.calls, input).then((result) => result.error?.code)

  test('a summary is at most 500 characters and not blank', async () => {
    expect(await refused({ summary: 'x'.repeat(501), edits: [edit()] })).toBe('invalidInput')
    expect(await refused({ summary: '   ', edits: [edit()] })).toBe('invalidInput')
  })

  test('record and node ids must be UUIDs', async () => {
    expect(await refused({ summary: 's', edits: [edit({ recordUuid: 'r-1' })] })).toBe('invalidInput')
    expect(await refused({ summary: 's', edits: [edit({ nodeUuid: 'not a uuid' })] })).toBe('invalidInput')
  })

  test(`at most ${RECORD_EDITS_MAX} edits, with a message that says to split`, async () => {
    const edits = Array.from({ length: RECORD_EDITS_MAX + 1 }, () => edit())
    const result = await run(tool, fake.calls, { summary: 's', edits })
    expect(result.error.code).toBe('invalidInput')
    expect(result.error.message).toContain('split')
  })

  test('a value is a bounded string, number, boolean, null or a small coordinate / code object', async () => {
    expect(await refused({ summary: 's', edits: [edit({ value: 'x'.repeat(2001) })] })).toBe('invalidInput')
    expect(await refused({ summary: 's', edits: [edit({ value: [1, 2] })] })).toBe('invalidInput')
    expect(await refused({ summary: 's', edits: [edit({ value: { x: { nested: true } } })] })).toBe('invalidInput')
    expect(await refused({ summary: 's', edits: [edit({ value: { anything: 'else' } })] })).toBe('invalidInput')
    expect(await refused({ summary: 's', edits: [edit({ value: { x: 'y'.repeat(201) } })] })).toBe('invalidInput')
  })

  test('the accepted value shapes reach the proposal code', () => {
    const { inputSchema } = tool
    const valid = [
      '12.5',
      12,
      true,
      null,
      { x: 1.5, y: '2', srs: 'EPSG:4326' },
      { x: 1, y: 2, srsId: '4326' },
      { code: 'B' },
      { scientificName: 'Acacia sp.' },
    ]
    for (const value of valid) {
      expect(inputSchema.safeParse({ summary: 's', edits: [edit({ value })] }).success).toBe(true)
    }
  })

  test('the schemas still convert to the JSON schema the provider gets', () => {
    for (const { inputSchema } of [tool, ...createValidationTools({ api: fake.api, getI18n: () => fakeI18n })]) {
      expect(() => z.toJSONSchema(inputSchema)).not.toThrow()
    }
  })
})

describe('the read tools of the cleaning area are bounded (382)', () => {
  const fake = newFakeCleaningApi()
  const getValues: any = createRecordGetValuesTool({ api: fake.api, getI18n: () => fakeI18n })
  const [summarize, list]: any[] = createValidationTools({ api: fake.api, getI18n: () => fakeI18n })

  test('record ids must be UUIDs', async () => {
    const getValuesResult = await run(getValues, fake.calls, { recordUuid: 'r', attributes: ['dbh'] })
    expect(getValuesResult.error.code).toBe('invalidInput')
    expect((await run(summarize, fake.calls, { recordUuid: 'r-1' })).error.code).toBe('invalidInput')
    expect((await run(list, fake.calls, { recordUuid: 'r-1' })).error.code).toBe('invalidInput')
  })

  test('record keys, attribute names and the offset have limits', async () => {
    const manyKeys = Object.fromEntries(Array.from({ length: 11 }, (_, index) => [`k${index}`, '1']))
    expect((await run(getValues, fake.calls, { recordKeys: manyKeys, attributes: ['dbh'] })).error.code).toBe(
      'invalidInput'
    )
    expect(
      (await run(getValues, fake.calls, { recordKeys: { cluster_id: 'x'.repeat(201) }, attributes: ['dbh'] })).error
        .code
    ).toBe('invalidInput')
    expect((await run(getValues, fake.calls, { recordUuid: uuidv4(), attributes: ['x'.repeat(101)] })).error.code).toBe(
      'invalidInput'
    )
    expect((await run(list, fake.calls, { offset: 1_000_001 })).error.code).toBe('invalidInput')
  })
})
