import SystemError from '@core/systemError'
import * as Survey from '@core/survey/survey'

import { createRecordCountTools } from '@webapp/ai/tools/analysis/recordCounts'

import { newAnalysisToolContext, newFakeAnalysisApi, runTool } from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

let survey: any = null

const dailyCounts = [
  { date: '2024-01-03', count: '3' },
  { date: '2024-01-20', count: '2' },
  { date: '2024-02-01', count: '1' },
]

const setUp = () => {
  const { api, calls } = newFakeAnalysisApi({
    fetchRecordsCountByStep: () => ({ '1': '4', '2': 2 }),
    fetchRecordsCountByDay: () => dailyCounts,
  })
  const [countByStepTool, countOverTimeTool] = createRecordCountTools({ api })
  return { countByStepTool, countOverTimeTool, calls, ctx: newAnalysisToolContext({ survey }) }
}

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('records_countByStep', () => {
  test('counts by step for the current cycle', async () => {
    const { countByStepTool, calls, ctx } = setUp()
    expect(await runTool(countByStepTool, {}, ctx)).toEqual({
      cycle: Survey.cycleOneKey,
      steps: [
        { step: 'entry', count: 4 },
        { step: 'cleansing', count: 2 },
        { step: 'analysis', count: 0 },
      ],
      total: 6,
    })
    expect(calls[0]).toMatchObject({ name: 'fetchRecordsCountByStep', params: { cycle: Survey.cycleOneKey } })
    expect(calls[0].params.signal).toBe(ctx.signal)
  })

  test('a timeout becomes queryTimeout; other errors are thrown', async () => {
    const timeout = newFakeAnalysisApi({
      fetchRecordsCountByStep: () => Promise.reject(new SystemError('queryTimeout')),
    })
    const [countByStepTool] = createRecordCountTools({ api: timeout.api })
    const ctx = newAnalysisToolContext({ survey })
    expect((await runTool(countByStepTool, {}, ctx)).error.code).toBe('queryTimeout')

    const failure = new Error('boom')
    const broken = newFakeAnalysisApi({ fetchRecordsCountByStep: () => Promise.reject(failure) })
    const [brokenTool] = createRecordCountTools({ api: broken.api })
    await expect(runTool(brokenTool, {}, ctx)).rejects.toBe(failure)
  })
})

describe('records_countOverTime', () => {
  test('by day', async () => {
    const { countOverTimeTool, calls, ctx } = setUp()
    const result = await runTool(countOverTimeTool, { from: '2024-01-01', to: '2024-02-29', groupBy: 'day' }, ctx)
    expect(result.counts).toEqual([
      { period: '2024-01-03', count: 3 },
      { period: '2024-01-20', count: 2 },
      { period: '2024-02-01', count: 1 },
    ])
    expect(result.total).toBe(6)
    expect(calls[0]).toMatchObject({ name: 'fetchRecordsCountByDay', params: { from: '2024-01-01', to: '2024-02-29' } })
    expect(calls[0].params.signal).toBe(ctx.signal)
  })

  test('by month', async () => {
    const { countOverTimeTool, ctx } = setUp()
    const result = await runTool(countOverTimeTool, { from: '2024-01-01', to: '2024-12-31', groupBy: 'month' }, ctx)
    expect(result.counts).toEqual([
      { period: '2024-01', count: 5 },
      { period: '2024-02', count: 1 },
    ])
  })

  test('range checks, without any request', async () => {
    const { countOverTimeTool, calls, ctx } = setUp()
    const run = (input: object) => runTool(countOverTimeTool, input, ctx)
    expect((await run({ from: '2023-01-01', to: '2024-12-31', groupBy: 'day' })).error.code).toBe('rangeTooLong')
    expect((await run({ from: '2000-01-01', to: '2024-12-31', groupBy: 'month' })).error.code).toBe('rangeTooLong')
    expect((await run({ from: '2024-02-01', to: '2024-01-01', groupBy: 'day' })).error.code).toBe('invalidRange')
    expect((await run({ from: '2024-13-45', to: '2024-12-31', groupBy: 'day' })).error.code).toBe('invalidRange')
    expect(calls).toHaveLength(0)
    expect(
      countOverTimeTool.inputSchema.safeParse({ from: '2024/01/01', to: '2024-01-02', groupBy: 'day' }).success
    ).toBe(false)
  })

  test('a timeout becomes queryTimeout', async () => {
    const timeout = newFakeAnalysisApi({
      fetchRecordsCountByDay: () => Promise.reject(new SystemError('queryTimeout')),
    })
    const [, countOverTimeTool] = createRecordCountTools({ api: timeout.api })
    const ctx = newAnalysisToolContext({ survey })
    const result = await runTool(countOverTimeTool, { from: '2024-01-01', to: '2024-02-29', groupBy: 'day' }, ctx)
    expect(result.error.code).toBe('queryTimeout')
  })

  test('both are data read tools', () => {
    const { countByStepTool, countOverTimeTool } = setUp()
    expect(countByStepTool).toMatchObject({ name: 'records_countByStep', dataClass: 'data', effect: 'read' })
    expect(countOverTimeTool).toMatchObject({ name: 'records_countOverTime', dataClass: 'data', effect: 'read' })
  })
})
