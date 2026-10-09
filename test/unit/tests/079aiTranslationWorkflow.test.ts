import { MockLanguageModelV4 } from 'ai/test'

import { translateLabelsWorkflow } from '@webapp/ai/workflows/translation'

describe('translateLabelsWorkflow', () => {
  test('returns the translations from the model answer', async () => {
    const answer = JSON.stringify({ translations: [{ id: 'label', byLang: { es: 'Árbol' } }] })
    const model = new MockLanguageModelV4({
      doGenerate: async () =>
        ({
          content: [{ type: 'text', text: answer }],
          finishReason: { unified: 'stop', raw: undefined },
          usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          warnings: [],
        }) as any,
    })
    const result = await translateLabelsWorkflow({
      surveyId: 1,
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [{ id: 'label', text: 'Tree', kind: 'nodeDefLabel' }],
      model,
    })
    expect(result.translations[0].byLang).toEqual({ es: 'Árbol' })
  })
})
