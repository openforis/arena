import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'
import enForm from '@core/i18n/resources/en/surveyForm'
import esForm from '@core/i18n/resources/es/surveyForm'
import frForm from '@core/i18n/resources/fr/surveyForm'
import jaForm from '@core/i18n/resources/ja/surveyForm'
import mnForm from '@core/i18n/resources/mn/surveyForm'
import ptForm from '@core/i18n/resources/pt/surveyForm'
import ruForm from '@core/i18n/resources/ru/surveyForm'

const commonByLang: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
const formByLang: Record<string, any> = {
  en: enForm,
  es: esForm,
  fr: frForm,
  ja: jaForm,
  mn: mnForm,
  pt: ptForm,
  ru: ruForm,
}
const CYRILLIC = /[Ѐ-ӿ]/

/**
 * Returns the sorted {{placeholders}} of a text.
 * @param {string} text - The text.
 * @returns {string[]} The placeholders.
 */
const placeholders = (text: string): string[] => (text.match(/\{\{\w+\}\}/g) ?? []).sort()

describe('AI batch texts (257)', () => {
  test.each(Object.keys(commonByLang))('%s has the aiBatch texts of en, with the same placeholders', (lang) => {
    const enTexts = en.aiBatch
    const texts = commonByLang[lang].aiBatch
    expect(Object.keys(texts).sort()).toEqual(Object.keys(enTexts).sort())
    for (const key of Object.keys(enTexts)) {
      expect([key, placeholders(texts[key])]).toEqual([key, placeholders(enTexts[key])])
    }
  })

  test.each(Object.keys(formByLang))('%s tells how many translations could not be produced', (lang) => {
    expect(formByLang[lang].nodeDefsTranslation.failed).toContain('{{count}}')
  })

  test.each(['ru', 'mn'])('%s texts are written in Cyrillic', (lang) => {
    const texts = [...Object.values(commonByLang[lang].aiBatch), formByLang[lang].nodeDefsTranslation.failed]
    for (const text of texts) {
      expect([text, CYRILLIC.test(text as string)]).toEqual([text, true])
    }
  })
})
