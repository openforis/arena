import { translateItems } from '@common/ai/tasks/translation'
import { expectSystemErrorKey, scriptedTextGenerator } from '@test/unit/utils/aiTestUtils'

const items = [{ id: 'label', text: 'Tree height', kind: 'nodeDefLabel' }]
const validAnswer = JSON.stringify({ translations: [{ id: 'label', byLang: { es: 'Altura del árbol' } }] })
const baseParams = { sourceLang: 'en', targetLangs: ['es'], items }

describe('translateItems', () => {
  test('parses a fenced JSON answer', async () => {
    const { generateText, calls } = scriptedTextGenerator('```json\n' + validAnswer + '\n```')
    const result = await translateItems({ generateText, ...baseParams })
    expect(result).toEqual({ translations: [{ id: 'label', byLang: { es: 'Altura del árbol' } }] })
    expect(calls).toHaveLength(1)
  })

  test('retries once with the parse error, then succeeds', async () => {
    const { generateText, calls } = scriptedTextGenerator('Sorry, here you go: nothing', validAnswer)
    const result = await translateItems({ generateText, ...baseParams })
    expect(result.translations[0].byLang.es).toBe('Altura del árbol')
    expect(calls[1].prompt).toMatch(/could not be parsed/)
  })

  test('fails with aiTranslationInvalid (no raw parser text) after two bad answers', async () => {
    const { generateText, calls } = scriptedTextGenerator('nope', '{"translations": "wrong"}')
    const error = await expectSystemErrorKey(translateItems({ generateText, ...baseParams }), 'aiTranslationInvalid')
    expect(error.statusCode).toBe(502)
    expect(calls).toHaveLength(2)
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
