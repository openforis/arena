import { endonyms, getLanguageEndonym } from '@core/app/languages'
import { supportedLanguages } from '@core/i18n/i18nFactory'

describe('getLanguageEndonym', () => {
  test('returns the language name in that language, capitalized', () => {
    expect(getLanguageEndonym('en')).toBe('English')
    expect(getLanguageEndonym('de')).toBe('Deutsch')
    expect(getLanguageEndonym('es')).toBe('Español')
    expect(getLanguageEndonym('id')).toBe('Bahasa Indonesia')
    expect(getLanguageEndonym('ru')).toBe('Русский')
    expect(getLanguageEndonym('ja')).toBe('日本語')
    expect(getLanguageEndonym('mn')).toBe('Монгол')
  })

  // the language menus show the endonym: a new UI language must have one
  test('every UI language has an endonym', () => {
    expect([...supportedLanguages].sort((a, b) => a.localeCompare(b))).toEqual(
      Object.keys(endonyms).sort((a, b) => a.localeCompare(b))
    )
  })
})
