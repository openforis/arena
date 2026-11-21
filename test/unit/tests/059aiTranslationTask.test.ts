import { translateItems } from '@common/ai/tasks/translation'
import { expectSystemErrorKey, scriptedTextGenerator } from '@test/unit/utils/aiTestUtils'

const items = [{ id: 'label', text: 'Tree height', kind: 'nodeDefLabel' }]
const validAnswer = JSON.stringify({ translations: [{ id: '1', byLang: { es: 'Altura del árbol' } }] })
const baseParams = { sourceLang: 'en', targetLangs: ['es'], items }

describe('translateItems', () => {
  test('parses a fenced JSON answer', async () => {
    const { generateText, calls } = scriptedTextGenerator('```json\n' + validAnswer + '\n```')
    const result = await translateItems({ generateText, ...baseParams })
    expect(result).toEqual({ translations: [{ id: 'label', byLang: { es: 'Altura del árbol' } }] })
    expect(calls).toHaveLength(1)
  })

  test('sends short ids and maps them back, dropping an id the model made up', async () => {
    const two = [...items, { id: 'other', text: 'Plot', kind: 'nodeDefLabel' }]
    const answer = JSON.stringify({
      translations: [
        { id: '2', byLang: { es: 'Parcela' } },
        { id: '1', byLang: { es: 'Altura' } },
        { id: '9', byLang: { es: 'Inventada' } },
      ],
    })
    const { generateText, calls } = scriptedTextGenerator(answer)
    const result = await translateItems({ generateText, ...baseParams, items: two })
    expect(result.translations).toEqual([
      { id: 'other', byLang: { es: 'Parcela' } },
      { id: 'label', byLang: { es: 'Altura' } },
    ])
    expect(calls[0].prompt).toMatch(/id="1"/)
    expect(calls[0].prompt).not.toMatch(/id="label"/)
  })

  test('an unusable answer is not repeated: aiTranslationInvalid, one call', async () => {
    const { generateText, calls } = scriptedTextGenerator('nope')
    const error = await expectSystemErrorKey(translateItems({ generateText, ...baseParams }), 'aiTranslationInvalid')
    expect(error.statusCode).toBe(502)
    expect(calls).toHaveLength(1)
  })

  test.each([
    [{ sourceLang: '' }, 'aiTranslationSourceLangMissing'],
    [{ sourceLang: 'x'.repeat(17) }, 'aiInputTooLong'],
    [{ targetLangs: [] }, 'aiTranslationTargetLangsMissing'],
    [{ targetLangs: Array.from({ length: 21 }, (_, i) => `l${i}`) }, 'aiTranslationTooManyItems'],
    [{ items: [] }, 'aiTranslationItemsMissing'],
    [{ items: Array.from({ length: 51 }, (_, i) => ({ id: `${i}`, text: 't' })) }, 'aiTranslationTooManyItems'],
    [{ items: [{ id: 'a', text: 'x'.repeat(2001) }] }, 'aiInputTooLong'],
    [{ glossary: [{ source: 'x'.repeat(201), byLang: {} }] }, 'aiInputTooLong'],
  ])('rejects %p with %p before calling the model', async (override, key) => {
    const { generateText, calls } = scriptedTextGenerator()
    await expectSystemErrorKey(translateItems({ generateText, ...baseParams, ...override }), key)
    expect(calls).toHaveLength(0)
  })
})
