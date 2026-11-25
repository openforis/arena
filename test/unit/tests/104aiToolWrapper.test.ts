import { z } from 'zod'

import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import { limitToolResult } from '@webapp/ai/tools/common/toolResult'
import { runTool, toAiSdkTools } from '@webapp/ai/tools/registry'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiTool } from '@webapp/ai/tools/types'

const makeTool = (execute: AiTool['execute']): AiTool => ({
  name: 'test_tool',
  description: 'Test',
  inputSchema: z.object({ name: z.string() }),
  area: ['design'],
  dataClass: 'schema',
  requires: () => true,
  execute,
})

describe('runTool', () => {
  test('returns the result of execute with the parsed input', async () => {
    const tool = makeTool(async (input) => ({ echo: input.name }))
    expect(await runTool(tool, { name: 'tree' }, createToolContext())).toEqual({ echo: 'tree' })
  })

  test('invalid input becomes a structured invalidInput error', async () => {
    let called = false
    const tool = makeTool(async () => {
      called = true
      return null
    })
    const result: any = await runTool(tool, { name: 3 }, createToolContext())
    expect(result.error.code).toBe('invalidInput')
    expect(result.error.message).toMatch(/name/)
    expect(called).toBe(false)
  })

  describe('a list sent as a string (small models do it)', () => {
    const listTool: AiTool = {
      ...makeTool(async (input) => input),
      inputSchema: z.object({
        names: z.array(z.string().max(5)).max(3).nullish(),
        filter: z.string().nullish(),
        measures: z.array(z.object({ functions: z.array(z.string()) })).nullish(),
      }),
    }
    const run = (input: unknown): Promise<any> => runTool(listTool, input, createToolContext())

    test('names separated by commas, one name or a JSON array become the list', async () => {
      expect(await run({ names: 'dbh, h' })).toEqual({ names: ['dbh', 'h'] })
      expect(await run({ names: 'dbh' })).toEqual({ names: ['dbh'] })
      expect(await run({ names: '["dbh","h"]' })).toEqual({ names: ['dbh', 'h'] })
      expect(await run({ measures: [{ functions: 'avg, cnt' }] })).toEqual({
        measures: [{ functions: ['avg', 'cnt'] }],
      })
    })

    test('two arguments merged in one key (name=[...],other) are read as the two arguments', async () => {
      expect(await run({ 'names=["dbh"],filter': 'dbh > 1' })).toEqual({ names: ['dbh'], filter: 'dbh > 1' })
      expect(await run({ 'names=[],filter': 'dbh > 1' })).toEqual({ names: [], filter: 'dbh > 1' })
      expect(await run({ 'names[],filter': 'dbh > 1' })).toEqual({ names: [], filter: 'dbh > 1' })
      // stray quotes around the names, at any depth
      expect(await run({ 'names"': ['dbh'], measures: [{ '"functions"': ['avg'] }] })).toEqual({
        names: ['dbh'],
        measures: [{ functions: ['avg'] }],
      })
      // not a value that can be read: the input stays invalid
      expect((await run({ 'names=[oops,filter': 'dbh > 1', measures: 3 })).error.code).toBe('invalidInput')
    })

    test('the list is still validated: the limits of the schema hold', async () => {
      expect((await run({ names: 'a, b, c, d' })).error.code).toBe('invalidInput')
      expect((await run({ names: 'too_long_name' })).error.code).toBe('invalidInput')
      expect((await run({ measures: 'avg' })).error.code).toBe('invalidInput')
    })

    test('a string where a string is expected is left as it is', async () => {
      expect(await run({ filter: 'a == 1, b' })).toEqual({ filter: 'a == 1, b' })
    })
  })

  test('an AiToolFailure keeps its code and details', async () => {
    const tool = makeTool(async () => {
      throw new AiToolFailure('nodeDefNotFound', 'No node definition named tre.', { closestNames: ['tree'] })
    })
    expect(await runTool(tool, { name: 'tre' }, createToolContext())).toEqual({
      error: { code: 'nodeDefNotFound', message: 'No node definition named tre.', closestNames: ['tree'] },
    })
  })

  test('any other error becomes toolFailed', async () => {
    const tool = makeTool(async () => {
      throw new Error('boom')
    })
    expect(await runTool(tool, { name: 'x' }, createToolContext())).toEqual({
      error: { code: 'toolFailed', message: 'boom' },
    })
  })

  test('abort: nothing runs and the abort error is re-thrown', async () => {
    const controller = new AbortController()
    controller.abort()
    let called = false
    const tool = makeTool(async () => {
      called = true
      return null
    })
    await expect(runTool(tool, { name: 'x' }, createToolContext({ signal: controller.signal }))).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(called).toBe(false)
  })

  test('abort during execute is re-thrown, not turned into a result', async () => {
    const controller = new AbortController()
    const tool = makeTool(async () => {
      controller.abort()
      throw new Error('fetch aborted')
    })
    await expect(runTool(tool, { name: 'x' }, createToolContext({ signal: controller.signal }))).rejects.toBeDefined()
  })

  test('a too-long result is truncated', async () => {
    const tool = makeTool(async () => ({ text: 'x'.repeat(9000) }))
    const result: any = await runTool(tool, { name: 'x' }, createToolContext())
    expect(result.truncated).toBe(true)
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(8000)
    expect(result.text.startsWith('xxx')).toBe(true)
  })
})

describe('limitToolResult', () => {
  test('keeps short results and undefined becomes null', () => {
    expect(limitToolResult({ a: 1 })).toEqual({ a: 1 })
    expect(limitToolResult(undefined)).toBeNull()
    expect(limitToolResult({ a: 'x'.repeat(20) }, 10)).toEqual({ truncated: true })
  })
})

describe('toAiSdkTools', () => {
  test('one SDK tool per tool, executing through the wrapper', async () => {
    const tool = makeTool(async (input) => ({ echo: input.name }))
    const sdkTools: any = toAiSdkTools([tool], createToolContext())
    expect(Object.keys(sdkTools)).toEqual(['test_tool'])
    expect(sdkTools.test_tool.description).toBe('Test')
    expect(sdkTools.test_tool.inputSchema.jsonSchema).toMatchObject({ type: 'object', required: ['name'] })
    expect(sdkTools.test_tool.inputSchema.jsonSchema.$schema).toBeUndefined()
    expect(await sdkTools.test_tool.execute({ name: 'a' }, { toolCallId: 'c1', messages: [] })).toEqual({ echo: 'a' })
    expect(await sdkTools.test_tool.execute({}, { toolCallId: 'c2', messages: [] })).toMatchObject({
      error: { code: 'invalidInput' },
    })
  })
})
