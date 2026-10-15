import fs from 'fs'
import path from 'path'

import { AiLimits } from '@common/ai/limits'

import * as analysisToolResults from '@webapp/ai/tools/analysis/toolResults'
import {
  TOOL_RESULT_BUDGET_CHARS,
  TOOL_RESULT_MAX_CHARS,
  fitListToBudget,
  limitToolResult,
  takeWithinBudget,
  toolError,
} from '@webapp/ai/tools/common/toolResult'
import { runTool } from '@webapp/ai/tools/registry'
import { listEntitiesTool } from '@webapp/ai/tools/analysis/listEntities'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import { buildAssistantSurvey } from '@test/unit/utils/assistantTestUtils'

const size = (value: unknown) => JSON.stringify(value).length

describe('one tool result budget (385)', () => {
  test('the budget is the limit minus room for the wrapper fields', () => {
    expect(TOOL_RESULT_MAX_CHARS).toBe(AiLimits.assistantToolResultMaxChars)
    expect(TOOL_RESULT_BUDGET_CHARS).toBe(AiLimits.assistantToolResultMaxChars - 500)
  })

  test('no tool computes its own budget or keeps its own toolError', () => {
    const toolsDir = path.resolve(__dirname, '../../../webapp/ai/tools')
    const files = fs.readdirSync(toolsDir, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.ts'))
    const offenders = files.filter((file) => {
      if (file === path.join('common', 'toolResult.ts')) return false
      const source = fs.readFileSync(path.join(toolsDir, file), 'utf8')
      return /assistantToolResultMaxChars|const toolError\b|export const toolError\b/.test(source)
    })
    // the registry only reads the limit through the shared module
    expect(offenders).toEqual([])
    expect('toolError' in analysisToolResults).toBe(false)
    expect('RESULT_MAX_CHARS' in analysisToolResults).toBe(false)
  })
})

describe('limitToolResult cuts at a value boundary (385)', () => {
  test('a result within the limit is returned as is', () => {
    expect(limitToolResult({ a: 1 })).toEqual({ a: 1 })
    expect(limitToolResult(undefined)).toBeNull()
  })

  test('an object with a long list keeps its leading items and says it was cut', () => {
    const output = { total: 100, nodes: Array.from({ length: 100 }, (_, index) => ({ index, text: 'x'.repeat(40) })) }
    const limited: any = limitToolResult(output, 1000)
    expect(size(limited)).toBeLessThanOrEqual(1000)
    expect(limited.truncated).toBe(true)
    expect(limited.total).toBe(100)
    expect(limited.json).toBeUndefined()
    expect(limited.nodes.length).toBeGreaterThan(0)
    expect(limited.nodes.length).toBeLessThan(100)
    expect(limited.nodes).toEqual(output.nodes.slice(0, limited.nodes.length))
  })

  test('quotes do not push the result over the limit (the old cut was re-escaped)', () => {
    const limited = limitToolResult({ text: '"'.repeat(5000) }, 1000)
    expect(size(limited)).toBeLessThanOrEqual(1000)
  })

  test('a top-level list and a long string are wrapped and cut', () => {
    const list: any = limitToolResult(
      Array.from({ length: 200 }, (_, index) => ({ index })),
      500
    )
    expect(size(list)).toBeLessThanOrEqual(500)
    expect(list.truncated).toBe(true)
    expect(list.items[0]).toEqual({ index: 0 })

    const text: any = limitToolResult('y'.repeat(3000), 500)
    expect(size(text)).toBeLessThanOrEqual(500)
    expect(text).toMatchObject({ truncated: true })
    expect(text.text.startsWith('yyy')).toBe(true)
  })

  test('the largest list is the one that is cut, small fields stay whole', () => {
    const output = { note: 'keep me', small: [1, 2, 3], big: Array.from({ length: 300 }, () => 'z'.repeat(20)) }
    const limited: any = limitToolResult(output, 800)
    expect(limited.note).toBe('keep me')
    expect(limited.small).toEqual([1, 2, 3])
    expect(limited.big.length).toBeLessThan(300)
  })
})

describe('takeWithinBudget and fitListToBudget (385)', () => {
  test('takeWithinBudget keeps the leading items that fit, counting the rest of the result', () => {
    const items = Array.from({ length: 50 }, (_, index) => ({ index, pad: 'p'.repeat(100) }))
    const taken = takeWithinBudget(items, { baseChars: TOOL_RESULT_BUDGET_CHARS - 500 })
    expect(taken.length).toBeGreaterThan(0)
    expect(taken.length).toBeLessThan(50)
    expect(size(taken) + (TOOL_RESULT_BUDGET_CHARS - 500)).toBeLessThanOrEqual(TOOL_RESULT_BUDGET_CHARS)
    expect(takeWithinBudget(items.slice(0, 2), { baseChars: 10 })).toEqual(items.slice(0, 2))
  })

  test('fitListToBudget defaults to the shared budget', () => {
    const result = { items: Array.from({ length: 1000 }, (_, index) => ({ index, pad: 'p'.repeat(50) })) }
    const fitted = fitListToBudget(result, 'items')
    expect(size(fitted)).toBeLessThanOrEqual(TOOL_RESULT_BUDGET_CHARS)
    expect(fitted.truncated).toBe(true)
  })
})

describe('one toolError (385)', () => {
  test('builds the result with the details', () => {
    expect(toolError('code', 'message', { a: 1 })).toEqual({ error: { code: 'code', message: 'message', a: 1 } })
    expect(toolError('code', 'message')).toEqual({ error: { code: 'code', message: 'message' } })
  })

  test('details that do not fit the limit are dropped', () => {
    const result = toolError('code', 'm'.repeat(2000), { list: ['x'.repeat(10_000)] })
    expect(size(result)).toBeLessThanOrEqual(TOOL_RESULT_MAX_CHARS)
    expect(result.error).toMatchObject({ code: 'code', detailsDropped: true })
  })

  test('the registry turns an AiToolFailure of a tool into the same result', async () => {
    const survey = await buildAssistantSurvey()
    const ctx = createToolContext({ survey })
    const result: any = await runTool(listEntitiesTool, { entity: 'no_such_entity' }, ctx)
    expect(result.error.code).toBe('unknownEntity')
    expect(new AiToolFailure('c', 'm', { k: 1 }).details).toEqual({ k: 1 })
  })
})
