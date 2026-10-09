import { toChatCompletion, toChatCompletionChunks, toMockPrompt } from '@test/e2e/stubs/localModelServer'

describe('local model server stub', () => {
  test('OpenAI messages become the mock prompt, tool results with their tool name', () => {
    const prompt = toMockPrompt([
      { role: 'system', content: 'system text' },
      { role: 'user', content: [{ type: 'text', text: 'hello' }] },
      {
        role: 'assistant',
        content: null,
        tool_calls: [{ id: 'c1', type: 'function', function: { name: 'query_run', arguments: '{"queryId":"q1"}' } }],
      },
      { role: 'tool', tool_call_id: 'c1', content: '{"rows":[1]}' },
      { role: 'tool', tool_call_id: 'c2', content: 'plain text' },
    ])
    expect(prompt).toEqual([
      { role: 'system', content: 'system text' },
      { role: 'user', content: [{ type: 'text', text: 'hello' }] },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'query_run', input: { queryId: 'q1' } }],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c1',
            toolName: 'query_run',
            output: { type: 'json', value: { rows: [1] } },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: 'c2', toolName: '', output: { type: 'text', value: 'plain text' } },
        ],
      },
    ])
  })

  test('a tool call answer ends with finish_reason tool_calls', () => {
    const body = toChatCompletion([
      { type: 'tool-call', toolCallId: 'c1', toolName: 'query_run', input: '{"queryId":"q1"}' },
    ])
    expect(body.choices[0]).toEqual({
      index: 0,
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [{ id: 'c1', type: 'function', function: { name: 'query_run', arguments: '{"queryId":"q1"}' } }],
      },
      finish_reason: 'tool_calls',
    })
  })

  test('streamed text becomes content deltas, then stop', () => {
    const chunks = toChatCompletionChunks([
      { type: 'stream-start', warnings: [] },
      { type: 'text-start', id: 't' },
      { type: 'text-delta', id: 't', delta: 'MOCK ' },
      { type: 'text-delta', id: 't', delta: 'answer.' },
      { type: 'text-end', id: 't' },
    ] as any) as any[]
    expect(chunks.map((chunk) => chunk.choices[0]?.delta?.content ?? null)).toEqual([
      '',
      'MOCK ',
      'answer.',
      null,
      null,
    ])
    expect(chunks.map((chunk) => chunk.choices[0]?.finish_reason ?? null)).toEqual([null, null, null, 'stop', null])
  })
})
