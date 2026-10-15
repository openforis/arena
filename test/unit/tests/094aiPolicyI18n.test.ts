import { createI18nAsync } from '@core/i18n/i18nFactory'
import * as ActivityLog from '@common/activityLog/activityLog'

import {
  CYRILLIC,
  CYRILLIC_LANGUAGES,
  getPath,
  LANGUAGES as languages,
  leafPaths,
  RESOURCES as resources,
} from '../utils/i18nParity'

const en = resources.en

const groups = ['common.aiPolicy', 'common.aiDataLocation', 'homeView.surveyInfo.aiPolicy']
const errorKeys = ['aiPolicyRefused', 'aiPolicyInvalid', 'aiPolicyAboveCeiling', 'aiPolicyDataAboveSchema']

describe('AI policy i18n', () => {
  test.each(languages)('%s has every AI policy key of en', (lang) => {
    for (const group of groups) {
      expect(leafPaths(getPath(resources[lang], group))).toEqual(leafPaths(getPath(en, group)))
    }
    for (const key of errorKeys) {
      expect(typeof resources[lang].appErrors[key]).toBe('string')
    }
  })

  test.each(CYRILLIC_LANGUAGES)('%s texts are in Cyrillic', (lang) => {
    expect(resources[lang].homeView.surveyInfo.aiPolicy.title).toMatch(CYRILLIC)
    expect(resources[lang].common.aiPolicy.level.cloud).toMatch(CYRILLIC)
  })

  test.each(['en', 'fr', 'ja'])('%s has the activity log message', (lang) => {
    expect(typeof resources[lang].activityLog.messages[ActivityLog.type.surveyAiPolicyUpdate]).toBe('string')
  })

  test('en: aiPolicyRefused translates the class names', async () => {
    const t: (key: string, params?: Record<string, string>) => string = (await createI18nAsync('en')).t as any
    expect(t('appErrors:aiPolicyRefused', { dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' })).toBe(
      "This survey's AI policy doesn't allow sending record data to the cloud."
    )
    expect(t('appErrors:aiPolicyRefused', { dataClass: 'schema', hostingClass: 'unknown', allowed: 'off' })).toBe(
      "This survey's AI policy doesn't allow sending the survey design to an unknown AI service."
    )
  })

  test.each(languages)('%s: nested labels are resolved in the error messages', async (lang) => {
    const t: (key: string, params?: Record<string, string>) => string = (await createI18nAsync(lang)).t as any
    const messages = [
      t('appErrors:aiPolicyRefused', { dataClass: 'data', hostingClass: 'orgHosted', allowed: 'onDevice' }),
      t('appErrors:aiPolicyAboveCeiling', { dataClass: 'schema', level: 'cloud', ceiling: 'orgHosted' }),
      t('appErrors:aiPolicyDataAboveSchema', { schema: 'onDevice', data: 'cloud' }),
    ]
    for (const message of messages) {
      expect(message).not.toMatch(/\$t\(|\{\{|aiPolicy\.|common:/)
    }
  })
})
