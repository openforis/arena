import { z } from 'zod'

import { limitToolResult, runTool, toAiSdkTools } from '@webapp/ai/tools/registry'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiTool } from '@webapp/ai/tools/types'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'

const makeTool = (execute: AiTool['execute']): AiTool => ({
  name: 'test_tool',
  description: 'Test',
  inputSchema: z.object({ name: z.string() }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
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
    expect(result.json).toHaveLength(8000)
  })
})

describe('limitToolResult', () => {
  test('keeps short results and undefined becomes null', () => {
    expect(limitToolResult({ a: 1 })).toEqual({ a: 1 })
    expect(limitToolResult(undefined)).toBeNull()
    expect(limitToolResult({ a: 'x'.repeat(20) }, 10)).toEqual({ truncated: true, json: '{"a":"xxxx' })
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
