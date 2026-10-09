import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { summarizeActivityLogWorkflow } from '@webapp/ai/workflows/activityLog'

const buildModel = () =>
  new MockLanguageModelV4({
    doStream: async () =>
      ({
        stream: convertArrayToReadableStream([
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: 'Ann created a record.' },
          { type: 'text-end', id: 't' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          },
        ]),
      }) as any,
  })

describe('summarizeActivityLogWorkflow', () => {
  test('fetches up to 1000 entries, aggregates them and streams the summary', async () => {
    const fetchCalls: any[] = []
    // 8 entries of the same user and type, newest first: distinct times so the sampling bound is observable
    const entries = Array.from({ length: 8 }, (_, index) => ({
      userName: 'ann',
      type: 'recordCreate',
      dateCreated: `2026-05-01T10:00:0${7 - index}Z`,
    }))
    const fetchEntries = async (params: any) => {
      fetchCalls.push(params)
      return entries
    }
    const model = buildModel()
    const chunks: string[] = []
    await summarizeActivityLogWorkflow({
      surveyId: 3,
      surveyName: 'forest',
      onChunk: (chunk) => chunks.push(chunk),
      model,
      fetchEntries,
    })
    expect(fetchCalls[0]).toMatchObject({ surveyId: 3, limit: 1000 })
    expect(chunks.join('')).toBe('Ann created a record.')
    const promptText = JSON.stringify(model.doStreamCalls[0].prompt)
    expect(promptText).toMatch(/recordCreate/)
    expect(promptText).toMatch(/count=8/)
    // aggregated: only the first 3 sample times of the 8 entries are listed
    const samples = promptText.match(/samples=([^\\]*)/)?.[1].split(', ')
    expect(samples).toEqual(['2026-05-01T10:00:07', '2026-05-01T10:00:06', '2026-05-01T10:00:05'])
  })
})
