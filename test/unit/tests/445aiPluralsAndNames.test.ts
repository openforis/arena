import { createI18nAsync } from '@core/i18n/i18nFactory'

import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'
import enErrors from '@core/i18n/resources/en/appErrors'
import esErrors from '@core/i18n/resources/es/appErrors'
import frErrors from '@core/i18n/resources/fr/appErrors'
import jaErrors from '@core/i18n/resources/ja/appErrors'
import mnErrors from '@core/i18n/resources/mn/appErrors'
import ptErrors from '@core/i18n/resources/pt/appErrors'
import ruErrors from '@core/i18n/resources/ru/appErrors'
import enSettings from '@core/i18n/resources/en/userAiSettings'
import esSettings from '@core/i18n/resources/es/userAiSettings'
import frSettings from '@core/i18n/resources/fr/userAiSettings'
import jaSettings from '@core/i18n/resources/ja/userAiSettings'
import mnSettings from '@core/i18n/resources/mn/userAiSettings'
import ptSettings from '@core/i18n/resources/pt/userAiSettings'
import ruSettings from '@core/i18n/resources/ru/userAiSettings'

import { getDefaultNameKey, getProviderNameText } from '@webapp/components/ai/UserAiSettingsPanel/providerNames'

const LANGS = ['en', 'es', 'fr', 'ja', 'mn', 'pt', 'ru']
const common: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
const errors: Record<string, any> = {
  en: enErrors,
  es: esErrors,
  fr: frErrors,
  ja: jaErrors,
  mn: mnErrors,
  pt: ptErrors,
  ru: ruErrors,
}
const settings: Record<string, any> = {
  en: enSettings,
  es: esSettings,
  fr: frSettings,
  ja: jaSettings,
  mn: mnSettings,
  pt: ptSettings,
  ru: ruSettings,
}
const CYRILLIC = /[Ѐ-ӿ]/

// the {{count}} texts the redesign added whose number can be 1 (or ends in 1 in Russian)
const PLURALS: { name: string; get: (lang: string) => Record<string, string>; base: string }[] = [
  { name: 'aiAssistant.start.seeAll', get: (l) => common[l].aiAssistant.start, base: 'seeAll' },
  { name: 'aiAssistant.start.seeAllSuggestions', get: (l) => common[l].aiAssistant.start, base: 'seeAllSuggestions' },
  { name: 'aiAssistant.card.changes', get: (l) => common[l].aiAssistant.card, base: 'changes' },
  { name: 'userAiSettings.localServer.contextTokens', get: (l) => settings[l].localServer, base: 'contextTokens' },
]

describe('plural forms of the AI texts (445)', () => {
  describe.each(PLURALS)('$name', ({ get, base }) => {
    test.each(LANGS)('%s has every plural form of its language and keeps {{count}}', (lang) => {
      // i18next shows the raw key for a category without a text (ru: few and many, es/fr/pt: many for millions)
      const { pluralCategories } = new Intl.PluralRules(lang).resolvedOptions()
      const texts = get(lang)
      for (const category of pluralCategories) {
        const text = texts[`${base}_${category}`]
        expect([category, typeof text]).toEqual([category, 'string'])
        expect([category, text]).toEqual([category, expect.stringContaining('{{count}}')])
      }
    })

    test.each(['ru', 'mn'])('%s forms are Cyrillic', (lang) => {
      const forms = Object.entries(get(lang)).filter(([key]) => key.startsWith(`${base}_`))
      for (const [key, text] of forms) {
        expect([key, CYRILLIC.test(text)]).toEqual([key, true])
      }
    })
  })

  test('the number picks the form: English, Spanish and Russian', async () => {
    const en_ = (await createI18nAsync('en')).t as any
    const es_ = (await createI18nAsync('es')).t as any
    const ru_ = (await createI18nAsync('ru')).t as any
    expect(en_('common:aiAssistant.card.changes', { count: 1 })).toBe('1 change')
    expect(en_('common:aiAssistant.card.changes', { count: 3 })).toBe('3 changes')
    expect(es_('common:aiAssistant.start.seeAll', { count: 1 })).toBe('Ver 1 conversación')
    expect(es_('userAiSettings:localServer.contextTokens', { count: 1000000 })).toBe('Contexto: 1000000 tokens')
    expect([1, 2, 5, 21].map((count) => ru_('common:aiAssistant.card.changes', { count }))).toEqual([
      '1 изменение',
      '2 изменения',
      '5 изменений',
      '21 изменение',
    ])
  })
})

describe('texts added by the review fixes (445)', () => {
  test.each(LANGS)('%s has common.fetchError with its message', (lang) => {
    expect(common[lang].common.fetchError).toContain('{{message}}')
  })

  test.each(LANGS)('%s names the show / hide button of the password input', (lang) => {
    expect(typeof common[lang].common.showValue).toBe('string')
    expect(typeof common[lang].common.hideValue).toBe('string')
    expect(common[lang].common.showValue).not.toBe(common[lang].common.hideValue)
  })

  test.each(['ru', 'mn'])('%s show / hide texts are Cyrillic', (lang) => {
    expect(common[lang].common.showValue).toMatch(CYRILLIC)
    expect(common[lang].common.hideValue).toMatch(CYRILLIC)
  })

  test.each(LANGS)('%s has the new settings texts', (lang) => {
    const s = settings[lang]
    for (const text of [s.unknownError, s.dialog.removeKey, s.dialog.keepKey, s.dialog.apiKeyRemoved]) {
      expect(typeof text).toBe('string')
    }
    for (const type of [
      'local',
      'orgServer',
      'openai',
      'anthropic',
      'google',
      'openai-compatible',
      'vercel-ai-sdk',
      'mock',
    ]) {
      expect([type, typeof s.defaultName[type]]).toEqual([type, 'string'])
    }
  })

  test.each(['ru', 'mn'])('%s new settings texts are Cyrillic', (lang) => {
    const s = settings[lang]
    for (const text of [s.unknownError, s.dialog.removeKey, s.dialog.keepKey, s.dialog.apiKeyRemoved]) {
      expect(text).toMatch(CYRILLIC)
    }
    expect(s.defaultName.local).toMatch(CYRILLIC)
    expect(s.defaultName.orgServer).toMatch(CYRILLIC)
  })

  test.each(LANGS)('%s aiPolicyAboveCeiling names the data class', async (lang) => {
    expect(errors[lang].aiPolicyAboveCeiling).toContain('{{dataClass}}')
    const t = (await createI18nAsync(lang)).t as any
    const params = { dataClass: 'data', level: 'cloud', ceiling: 'orgHosted' }
    const message: string = t('appErrors:aiPolicyAboveCeiling', params)
    expect(message).not.toMatch(/\$t\(|\{\{|common:/)
    expect(message).toContain(t('common:aiPolicy.dataClass.data'))
  })
})

describe('default provider names (445)', () => {
  const t = (key: string) => `T(${key})`

  test('the English default of a type maps to its translated name', () => {
    expect(getDefaultNameKey({ name: 'Local server', providerType: 'local' })).toBe('userAiSettings:defaultName.local')
    expect(getDefaultNameKey({ name: 'OpenAI', providerType: 'openai' })).toBe('userAiSettings:defaultName.openai')
    expect(getDefaultNameKey({ name: 'Vercel AI SDK', providerType: 'vercel-ai-sdk' })).toBe(
      'userAiSettings:defaultName.vercel-ai-sdk'
    )
  })

  test('an Organisation server is stored as openai-compatible and shown as its own type', () => {
    expect(getDefaultNameKey({ name: 'Organisation server', providerType: 'openai-compatible' })).toBe(
      'userAiSettings:defaultName.orgServer'
    )
    expect(getDefaultNameKey({ name: 'OpenAI-compatible', providerType: 'openai-compatible' })).toBe(
      'userAiSettings:defaultName.openai-compatible'
    )
  })

  test('a name the user typed is shown as it is, also when it looks like another type', () => {
    expect(getProviderNameText({ name: 'Desk GPU', providerType: 'local', t })).toBe('Desk GPU')
    expect(getProviderNameText({ name: 'OpenAI', providerType: 'anthropic', t })).toBe('OpenAI')
    expect(getProviderNameText({ name: 'Local server', providerType: 'local', t })).toBe(
      'T(userAiSettings:defaultName.local)'
    )
  })

  test.each(LANGS)('%s translates every default name key', async (lang) => {
    const translate = (await createI18nAsync(lang)).t as any
    for (const type of [
      'local',
      'orgServer',
      'openai',
      'anthropic',
      'google',
      'openai-compatible',
      'vercel-ai-sdk',
      'mock',
    ]) {
      const key = `userAiSettings:defaultName.${type}`
      expect([key, translate(key)]).toEqual([key, settings[lang].defaultName[type]])
    }
  })
})
