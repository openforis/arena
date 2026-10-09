import { createI18nAsync } from '@core/i18n/i18nFactory'
import * as ActivityLog from '@common/activityLog/activityLog'

import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
const languages = Object.keys(resources)

const getPath = (obj: any, path: string): any => path.split('.').reduce((acc, part) => acc?.[part], obj)

// flattened "a.b.c" paths of every string leaf
const leafPaths = (obj: any, prefix = ''): string[] => {
  const paths: string[] = []
  for (const [key, value] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') paths.push(path)
    else paths.push(...leafPaths(value, path))
  }
  return paths.sort()
}

const groups = ['common.aiPolicy', 'common.aiDataLocation', 'homeView.surveyInfo.aiPolicy']
const errorKeys = ['aiPolicyRefused', 'aiPolicyInvalid', 'aiPolicyAboveCeiling']

describe('AI policy i18n', () => {
  test.each(languages)('%s has every AI policy key of en', (lang) => {
    for (const group of groups) {
      expect(leafPaths(getPath(resources[lang], group))).toEqual(leafPaths(getPath(en, group)))
    }
    for (const key of errorKeys) {
      expect(typeof resources[lang].appErrors[key]).toBe('string')
    }
  })

  test.each(['ru', 'mn'])('%s texts are in Cyrillic', (lang) => {
    expect(resources[lang].homeView.surveyInfo.aiPolicy.title).toMatch(/[Ѐ-ӿ]/)
    expect(resources[lang].common.aiPolicy.level.cloud).toMatch(/[Ѐ-ӿ]/)
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
    ]
    for (const message of messages) {
      expect(message).not.toMatch(/\$t\(|\{\{|aiPolicy\.|common:/)
    }
  })
})
