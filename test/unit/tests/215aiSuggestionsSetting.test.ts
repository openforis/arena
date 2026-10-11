import {
  AI_CATEGORIES_ON_BY_DEFAULT,
  AiFeatureCategory,
  AiFeatures,
  isAiCategoryOnByDefault,
} from '@common/ai/features'

import enSettings from '@core/i18n/resources/en/userAiSettings'
import esSettings from '@core/i18n/resources/es/userAiSettings'
import frSettings from '@core/i18n/resources/fr/userAiSettings'
import jaSettings from '@core/i18n/resources/ja/userAiSettings'
import mnSettings from '@core/i18n/resources/mn/userAiSettings'
import ptSettings from '@core/i18n/resources/pt/userAiSettings'
import ruSettings from '@core/i18n/resources/ru/userAiSettings'

import {
  defaultFeatureToggles as serverDefaults,
  isCategoryEnabledForUser,
  sanitiseFeatureToggles,
} from '@server/modules/ai/service/aiUserPrefs'
import { isAiCategoryEnabledInSettings } from '@webapp/ai/engines/featureSwitches'
import { createEmptyForm, settingsToForm } from '@webapp/components/ai/UserAiSettingsPanel/aiSettingsForm'
import { FEATURE_GROUPS } from '@webapp/components/ai/UserAiSettingsPanel/featureGroups'

const { assistantSuggestions, chat } = AiFeatureCategory

const userWith = (featureToggles: unknown, featuresEnabled = true): any => ({
  uuid: 'u1',
  prefs: { ai: { featuresEnabled, featureToggles } },
})

const settingsByLang: Record<string, any> = {
  en: enSettings,
  es: esSettings,
  fr: frSettings,
  ja: jaSettings,
  mn: mnSettings,
  pt: ptSettings,
  ru: ruSettings,
}

describe('proactive suggestions setting (215)', () => {
  test('a category with a feature that never calls a model (no gateway, no tools)', () => {
    expect(assistantSuggestions).toBe('assistantSuggestions')
    expect(AiFeatures.assistantSuggestions).toEqual({
      key: 'assistantSuggestions',
      category: assistantSuggestions,
      dataClass: 'schema',
      permission: 'loggedIn',
      gateway: false,
      tools: false,
    })
  })

  test('only this category is on by default', () => {
    expect(AI_CATEGORIES_ON_BY_DEFAULT).toEqual([assistantSuggestions])
    expect(isAiCategoryOnByDefault(assistantSuggestions)).toBe(true)
    expect(isAiCategoryOnByDefault(chat)).toBe(false)
    expect(isAiCategoryOnByDefault('unknown')).toBe(false)
  })

  test('server: an absent toggle is on, an explicit false stays off, the master switch still rules', () => {
    expect(serverDefaults()[assistantSuggestions]).toBe(true)
    expect(serverDefaults()[chat]).toBe(false)
    expect(sanitiseFeatureToggles({ chat: true })[assistantSuggestions]).toBe(true)
    expect(sanitiseFeatureToggles({ assistantSuggestions: false })[assistantSuggestions]).toBe(false)
    expect(sanitiseFeatureToggles({ assistantSuggestions: 'yes' })[assistantSuggestions]).toBe(true)
    expect(isCategoryEnabledForUser(userWith({ chat: true }), assistantSuggestions)).toBe(true)
    expect(isCategoryEnabledForUser(userWith(undefined), assistantSuggestions)).toBe(true)
    expect(isCategoryEnabledForUser(userWith({ assistantSuggestions: false }), assistantSuggestions)).toBe(false)
    expect(isCategoryEnabledForUser(userWith({}, false), assistantSuggestions)).toBe(false)
  })

  test('browser form: an absent toggle shows on, an explicit false shows off', () => {
    expect(createEmptyForm().featureToggles[assistantSuggestions]).toBe(true)
    expect(createEmptyForm().featureToggles[chat]).toBe(false)
    expect(settingsToForm({ featuresEnabled: true, featureToggles: { chat: true } }).featureToggles).toMatchObject({
      chat: true,
      assistantSuggestions: true,
      assistantDesign: false,
    })
    expect(
      settingsToForm({ featureToggles: { assistantSuggestions: false } }).featureToggles[assistantSuggestions]
    ).toBe(false)
    expect(settingsToForm({}).featureToggles[assistantSuggestions]).toBe(true)
  })

  test('the loaded settings (sanitised by the server) enable it once AI is on', () => {
    const featureToggles = sanitiseFeatureToggles({ chat: true })
    expect(isAiCategoryEnabledInSettings({ featuresEnabled: true, featureToggles }, assistantSuggestions)).toBe(true)
    expect(isAiCategoryEnabledInSettings({ featuresEnabled: false, featureToggles }, assistantSuggestions)).toBe(false)
    expect(
      isAiCategoryEnabledInSettings(
        { featuresEnabled: true, featureToggles, disabledFeatures: ['assistantSuggestions'] },
        assistantSuggestions
      )
    ).toBe(false)
  })

  test('the switch is in the "no survey content" group, next to the Help chat', () => {
    const group = FEATURE_GROUPS.find((item) => item.categories.includes(assistantSuggestions))
    expect(group?.id).toBe('noSurveyContent')
    expect(group?.categories).toEqual([chat, assistantSuggestions])
  })

  test.each(Object.keys(settingsByLang))('%s has a label and a "Sends:" text, and no runs line', (lang) => {
    const texts = settingsByLang[lang].features.assistantSuggestions
    expect(typeof texts.label).toBe('string')
    expect(typeof texts.sends).toBe('string')
    expect(texts.runs).toBeUndefined()
  })

  test.each(Object.keys(settingsByLang).filter((lang) => lang !== 'en'))('%s translates the label', (lang) => {
    expect(settingsByLang[lang].features.assistantSuggestions.label).not.toBe(
      enSettings.features.assistantSuggestions.label
    )
  })
})
