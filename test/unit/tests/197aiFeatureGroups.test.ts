import { AiFeatureCategory, AiFeaturePermission, AiFeatures } from '@common/ai/features'

import enSettings from '@core/i18n/resources/en/userAiSettings'
import esSettings from '@core/i18n/resources/es/userAiSettings'
import frSettings from '@core/i18n/resources/fr/userAiSettings'
import jaSettings from '@core/i18n/resources/ja/userAiSettings'
import mnSettings from '@core/i18n/resources/mn/userAiSettings'
import ptSettings from '@core/i18n/resources/pt/userAiSettings'
import ruSettings from '@core/i18n/resources/ru/userAiSettings'

import { FEATURE_GROUPS } from '@webapp/components/ai/UserAiSettingsPanel/featureGroups'

const settingsByLang: Record<string, any> = {
  en: enSettings,
  es: esSettings,
  fr: frSettings,
  ja: jaSettings,
  mn: mnSettings,
  pt: ptSettings,
  ru: ruSettings,
}

describe('feature groups', () => {
  test('in order: no survey content, survey design, record data', () => {
    expect(FEATURE_GROUPS.map((group) => group.id)).toEqual(['noSurveyContent', 'surveyDesign', 'recordData'])
  })

  test('every category is in exactly one group', () => {
    const grouped = FEATURE_GROUPS.flatMap((group) => group.categories)
    expect([...grouped].sort()).toEqual(Object.values(AiFeatureCategory).sort())
  })

  test("a group's data class is the data class of its features (the Help chat reads no survey)", () => {
    for (const group of FEATURE_GROUPS) {
      for (const feature of Object.values(AiFeatures)) {
        if (!feature.category || !group.categories.includes(feature.category)) continue
        const expected = feature.permission === AiFeaturePermission.loggedIn ? null : feature.dataClass
        expect([feature.key, group.dataClass]).toEqual([feature.key, expected])
      }
    }
  })

  test.each(Object.keys(settingsByLang))('%s has no runs text: every feature runs in the browser', (lang) => {
    const { features } = settingsByLang[lang]
    for (const category of Object.values(AiFeatureCategory)) {
      expect([category, features[category]?.runs]).toEqual([category, undefined])
    }
  })
})
