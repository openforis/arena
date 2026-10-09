import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { streamChatWorkflow } from '@webapp/ai/workflows/chat'

const streamingModel = () =>
  new MockLanguageModelV4({
    doStream: async () =>
      ({
        stream: convertArrayToReadableStream([
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: 'Hola' },
          { type: 'text-end', id: 't' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          },
        ]),
      }) as any,
  })

const uiMessage = (role: string, text: string) => ({ role, parts: [{ type: 'text', text }] })

describe('streamChatWorkflow', () => {
  test('sends the system prompt and the non-empty messages, streams the answer', async () => {
    const model = streamingModel()
    const chunks: string[] = []
    await streamChatWorkflow({
      messages: [uiMessage('user', 'hi'), uiMessage('assistant', ''), uiMessage('user', 'how to add a table?')],
      language: 'es',
      onChunk: (chunk) => chunks.push(chunk),
      model,
    })
    expect(chunks.join('')).toBe('Hola')
    const { prompt } = model.doStreamCalls[0]
    expect(prompt[0].role).toBe('system')
    expect(JSON.stringify(prompt[0].content)).toMatch(/Spanish|Español/)
    expect(prompt.slice(1).map((message) => message.role)).toEqual(['user', 'user'])
  })

  test('rejects an oversized conversation without calling the model', async () => {
    const model = streamingModel()
    const huge = uiMessage('user', 'x'.repeat(1_000_000))
    const error: any = await streamChatWorkflow({ messages: [huge], language: 'en', onChunk: () => {}, model }).catch(
      (err) => err
    )
    expect(error.key).toBe('aiChatbotPayloadTooLarge')
    expect(model.doStreamCalls).toHaveLength(0)
  })
})
