import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { explainExpressionWorkflow, generateExpressionWorkflow } from '@webapp/ai/workflows/expression'

const survey = { nodeDefs: { a: { uuid: 'a', props: { name: 'tree_height' }, type: 'decimal' } } }
const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } }
const finishReason = { unified: 'stop', raw: undefined }

describe('expression workflows', () => {
  test('generate runs the shared task on the given model', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () =>
        ({
          content: [{ type: 'text', text: '<expression>tree_height > 0</expression><explanation>ok</explanation>' }],
          finishReason,
          usage,
          warnings: [],
        }) as any,
    })
    const result = await generateExpressionWorkflow({
      survey,
      surveyId: 1,
      nodeDefUuid: 'a',
      expressionType: 'validation',
      description: 'positive',
      model,
    })
    expect(result).toMatchObject({ expression: 'tree_height > 0', isValid: true })
  })

  test('explain streams the chunks', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () =>
        ({
          stream: convertArrayToReadableStream([
            { type: 'text-start', id: 't' },
            { type: 'text-delta', id: 't', delta: 'It checks ' },
            { type: 'text-delta', id: 't', delta: 'positivity.' },
            { type: 'text-end', id: 't' },
            { type: 'finish', finishReason, usage },
          ]),
        }) as any,
    })
    const chunks: string[] = []
    await explainExpressionWorkflow({
      survey,
      surveyId: 1,
      nodeDefUuid: 'a',
      expression: 'tree_height > 0',
      onChunk: (chunk) => chunks.push(chunk),
      model,
    })
    expect(chunks.join('')).toBe('It checks positivity.')
    expect(model.doStreamCalls[0].prompt[0].role).toBe('system')
  })
})
