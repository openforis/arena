import { getLanguageEndonym } from '@core/app/languages'

describe('getLanguageEndonym', () => {
  test('returns the language name in that language, capitalized', () => {
    expect(getLanguageEndonym('en')).toBe('English')
    expect(getLanguageEndonym('de')).toBe('Deutsch')
    expect(getLanguageEndonym('es')).toBe('Español')
    expect(getLanguageEndonym('ru')).toBe('Русский')
    expect(getLanguageEndonym('ja')).toBe('日本語')
    expect(getLanguageEndonym('mn')).toBe('Монгол')
  })
})
