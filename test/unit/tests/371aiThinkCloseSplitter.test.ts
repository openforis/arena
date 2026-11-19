import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { stepCountIs, streamText, tool } from 'ai'
import { z } from 'zod'

import { createLocalServerEngine } from '@webapp/ai/engines/localServerEngine'
import { createThinkCloseSplitter, gemmaArgsToJson } from '@webapp/ai/engines/thinkCloseSplitter'

type Part = LanguageModelV4StreamPart

const finish = (unified: 'stop' | 'tool-calls' = 'stop'): Part => ({
  type: 'finish',
  finishReason: { unified, raw: unified },
  usage: {
    inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 1, text: 1, reasoning: 0 },
  },
})

const reasoningStream = (deltas: string[]): Part[] => [
  { type: 'reasoning-start', id: 'r' },
  ...deltas.map((delta): Part => ({ type: 'reasoning-delta', id: 'r', delta })),
  { type: 'reasoning-end', id: 'r' },
  finish(),
]

const split = async (parts: Part[]): Promise<Part[]> => {
  const out: Part[] = []
  const stream = new ReadableStream<Part>({
    start(controller) {
      for (const part of parts) controller.enqueue(part)
      controller.close()
    },
  }).pipeThrough(createThinkCloseSplitter())
  for await (const part of stream as any) out.push(part)
  return out
}

const reasoningOf = (parts: Part[]) => parts.map((part) => (part.type === 'reasoning-delta' ? part.delta : '')).join('')

// as written by Nemotron on LM Studio (bench, task d05)
const CALL =
  '<|tool_call>call:expressions_proposeSet{expressions:[{expression:<|"|>tree_bearing >= 0 && tree_bearing <= 360<|"|>,' +
  'severity:<|"|>error<|"|>}],nodeDefName:<|"|>tree_bearing<|"|>,prop:<|"|>validations.expressions<|"|>}<tool_call|>'

describe('think close splitter', () => {
  test('the Gemma arguments are read as JSON: bare keys, <|"|> strings, quotes and keys inside strings kept', () => {
    expect(JSON.parse(gemmaArgsToJson('{a:<|"|>say "hi", b:1<|"|>,list:[1,2],nested:{ok:true,none:null}}'))).toEqual({
      a: 'say "hi", b:1',
      list: [1, 2],
      nested: { ok: true, none: null },
    })
  })

  test('a tool call after a </think> text (split across deltas) becomes a tool call', async () => {
    const parts = await split(reasoningStream(['I will propose it.</th', 'ink>', CALL.slice(0, 40), CALL.slice(40)]))
    expect(reasoningOf(parts)).toBe('I will propose it.')
    const call: any = parts.find((part) => part.type === 'tool-call')
    expect(call.toolName).toBe('expressions_proposeSet')
    expect(JSON.parse(call.input)).toEqual({
      expressions: [{ expression: 'tree_bearing >= 0 && tree_bearing <= 360', severity: 'error' }],
      nodeDefName: 'tree_bearing',
      prop: 'validations.expressions',
    })
    // the call follows the end of the reasoning, and the step ends as a tool call step
    expect(parts.map((part) => part.type)).toEqual([
      'reasoning-start',
      'reasoning-delta',
      'reasoning-end',
      'tool-call',
      'finish',
    ])
    expect((parts.at(-1) as any).finishReason.unified).toBe('tool-calls')
  })

  test('an answer after a </think> text becomes text', async () => {
    const parts = await split(reasoningStream(['Done.</think>\n\nThere are 12 plots.']))
    expect(reasoningOf(parts)).toBe('Done.')
    expect(parts.find((part) => part.type === 'text-delta')).toMatchObject({ delta: 'There are 12 plots.' })
    expect((parts.at(-1) as any).finishReason.unified).toBe('stop')
  })

  test('a call that cannot be read stays in the reasoning, as it came', async () => {
    const deltas = ['Thinking.</think>', '<|tool_call>call:x{a:<|"|>open}<tool_call|>']
    const parts = await split(reasoningStream(deltas))
    expect(reasoningOf(parts)).toBe(deltas.join(''))
    expect(parts.some((part) => part.type === 'tool-call' || part.type === 'text-delta')).toBe(false)
  })

  test('reasoning without the marker is unchanged, a held "<" included', async () => {
    const parts = await split(reasoningStream(['a < b', ' and c </', 'b>']))
    expect(reasoningOf(parts)).toBe('a < b and c </b>')
    expect((parts.at(-1) as any).finishReason.unified).toBe('stop')
  })

  test('the local engine runs the tool written after </think> and gets to the answer', async () => {
    const chunk = (delta: object, finishReason: string | null = null) =>
      `data: ${JSON.stringify({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta, finish_reason: finishReason }] })}\n\n`
    const responses = [
      [chunk({ reasoning_content: 'Count them.</think>' }), chunk({ reasoning_content: CALL }), chunk({}, 'stop')],
      [chunk({ content: 'Proposed.' }), chunk({}, 'stop')],
    ]
    let call = 0
    const fetchImpl = async () =>
      new Response([...responses[call++], 'data: [DONE]\n\n'].join(''), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    const engine = createLocalServerEngine({
      localServer: {
        reachable: true,
        models: ['m'],
        hostingClass: 'onDevice',
        contextTokens: 4096,
        baseUrl: 'http://localhost:1234/v1',
        modelId: 'm',
        error: null,
      },
      fetchImpl,
    })
    const inputs: unknown[] = []
    const result = streamText({
      model: engine.createModel({ feature: 'assistantDesign', dataClass: 'schema' }),
      prompt: 'Add the rule.',
      stopWhen: stepCountIs(3),
      tools: {
        expressions_proposeSet: tool({
          inputSchema: z.object({ nodeDefName: z.string() }).passthrough(),
          execute: async (input) => {
            inputs.push(input)
            return { ok: true }
          },
        }),
      },
    })
    expect(await result.text).toBe('Proposed.')
    expect(inputs).toMatchObject([{ nodeDefName: 'tree_bearing' }])
  })
})
