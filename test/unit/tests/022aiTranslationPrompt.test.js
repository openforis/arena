/**
 * Tests for the prompt builder used by the survey-label translation
 * feature (Tier 1 #1).
 */
import { buildTranslationPrompt } from '@server/modules/ai/service/prompts/translation'

describe('buildTranslationPrompt', () => {
  test('emits a non-empty system prompt with style guidance', () => {
    const { system } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [{ id: '1', text: 'Tree height', kind: 'nodeDefLabel' }],
    })

    expect(system).toMatch(/translate/i)
    expect(system).toMatch(/Open Foris Arena/)
    expect(system).toMatch(/glossary/i)
    expect(system).toMatch(/byLang/)
  })

  test('user prompt contains source/target langs and every item', () => {
    const { prompt } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es', 'fr'],
      items: [
        { id: 'a', text: 'Tree height', kind: 'nodeDefLabel' },
        { id: 'b', text: 'Must be > 0', kind: 'validationMessage' },
      ],
    })

    expect(prompt).toMatch(/Source language: en/)
    expect(prompt).toMatch(/Target languages: es, fr/)
    expect(prompt).toMatch(/id="a"/)
    expect(prompt).toMatch(/id="b"/)
    expect(prompt).toMatch(/Tree height/)
    expect(prompt).toMatch(/Must be > 0/)
  })

  test('uses the right hint for each item kind', () => {
    const { prompt } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [
        { id: 'a', text: 'X', kind: 'nodeDefLabel' },
        { id: 'b', text: 'Y', kind: 'validationMessage' },
        { id: 'c', text: 'Z', kind: 'taxonVernacularName' },
      ],
    })

    expect(prompt).toMatch(/data-entry inputs/)
    expect(prompt).toMatch(/error message/)
    expect(prompt).toMatch(/vernacular/)
  })

  test('includes glossary when provided', () => {
    const { prompt } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [{ id: '1', text: 'Tree', kind: 'nodeDefLabel' }],
      glossary: [{ source: 'tree', byLang: { es: 'árbol' } }],
    })

    expect(prompt).toMatch(/Glossary/)
    expect(prompt).toMatch(/árbol/)
  })

  test('omits glossary block when empty', () => {
    const { prompt } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [{ id: '1', text: 'Tree' }],
    })

    expect(prompt).not.toMatch(/Glossary/)
  })

  test('system prompt specifies the exact JSON output shape', () => {
    const { system } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [{ id: '1', text: 'Tree' }],
    })

    expect(system).toMatch(/Reply with EXACTLY one JSON object/)
    expect(system).toMatch(/"translations"/)
    expect(system).toMatch(/"byLang"/)
    expect(system).toMatch(/Do not wrap the JSON in code fences/)
  })

  test('appends previous-error feedback when retrying', () => {
    const { prompt } = buildTranslationPrompt({
      sourceLang: 'en',
      targetLangs: ['es'],
      items: [{ id: '1', text: 'Tree' }],
      previousError: { message: 'Unexpected token } in JSON at position 42' },
    })

    expect(prompt).toMatch(/previous attempt/i)
    expect(prompt).toMatch(/Unexpected token/)
  })
})
