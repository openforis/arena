import {
  CYRILLIC,
  CYRILLIC_LANGUAGES,
  diffWithDefaultLanguage,
  LANGUAGES,
  namespaceByLanguage,
  pluralFormsOf,
} from '../utils/i18nParity'

const commonByLang = namespaceByLanguage('common')
const formByLang = namespaceByLanguage('surveyForm')

/**
 * Returns every plural form of the failed translations text of a language.
 * @param {string} lang - Language.
 * @returns {string[]} The texts.
 */
const failedTexts = (lang: string): string[] =>
  Object.entries(formByLang[lang].nodeDefsTranslation)
    .filter(([key]) => key.startsWith('failed_'))
    .map(([, text]) => text as string)

describe('AI batch texts (257)', () => {
  test.each(LANGUAGES)('%s has the aiBatch texts of en, with the same placeholders', (lang) => {
    expect(diffWithDefaultLanguage(lang, 'common.aiBatch')).toEqual({ missing: [], extra: [], placeholders: [] })
  })

  test.each(LANGUAGES)('%s tells how many translations could not be produced', (lang) => {
    const texts = failedTexts(lang)
    expect(texts.length).toBeGreaterThan(0)
    for (const text of texts) expect(text).toContain('{{count}}')
  })

  test.each(LANGUAGES)('%s has the plural forms of its language for the failed counts', (lang) => {
    // the forms i18next uses (Intl also lists "many" for es/fr/pt, which the other plural keys do not write)
    const forms = pluralFormsOf(lang)
    for (const base of [formByLang[lang].nodeDefsTranslation, formByLang[lang]]) {
      const key = base === formByLang[lang] ? 'schemaSummaryAiDescriptionsFailed' : 'failed'
      expect(forms.filter((form) => typeof base[`${key}_${form}`] === 'string')).toEqual(forms)
    }
  })

  test.each(CYRILLIC_LANGUAGES)('%s texts are written in Cyrillic', (lang) => {
    const texts = [...Object.values(commonByLang[lang].aiBatch), ...failedTexts(lang)]
    for (const text of texts) {
      expect([text, CYRILLIC.test(text as string)]).toEqual([text, true])
    }
  })
})
