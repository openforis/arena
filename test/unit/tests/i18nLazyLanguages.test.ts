import i18nServerInstance, { createI18nAsync } from '@core/i18n/i18nFactory'
import { languageLoaders } from '@core/i18n/languageLoaders'
import { defaultLanguage, supportedLanguages } from '@core/i18n/uiLanguages'
import i18nWebappInstance from '@webapp/store/system/i18n/i18nInstance'
import { resources } from '../utils/i18nResources'

const sorted = (values: string[]): string[] => [...values].sort((a, b) => a.localeCompare(b))

const ENGLISH_INVITE_SUBJECT = 'You have been invited to Open Foris Arena!'

describe('UI languages loaded when used', () => {
  test('the UI languages are the ones of the loaders and of the test resources', () => {
    expect(sorted([defaultLanguage, ...Object.keys(languageLoaders)])).toEqual(sorted(supportedLanguages))
    expect(sorted(Object.keys(resources))).toEqual(sorted(supportedLanguages))
  })

  test.each([
    ['server', i18nServerInstance],
    ['webapp', i18nWebappInstance],
  ])('%s: only English is loaded at startup', (_name, instance) => {
    expect(instance.hasResourceBundle('en', 'common')).toBe(true)
    expect(supportedLanguages.filter((lang) => instance.hasResourceBundle(lang, 'common'))).toEqual(['en'])
  })

  test('server: an instance in a language loads it, missing namespaces fall back to English', async () => {
    const i18n = await createI18nAsync('fr')
    expect(i18n.t('common.cancel')).toBe(resources.fr.common.common.cancel)
    // emails are in English only
    expect(i18n.t('emails:userInvite.subject')).toBe(ENGLISH_INVITE_SUBJECT)
    // the shared English instance is not affected
    expect(i18nServerInstance.hasResourceBundle('fr', 'common')).toBe(false)
  })

  test('webapp: a language is loaded when changed to, missing namespaces fall back to English', async () => {
    await i18nWebappInstance.changeLanguage('fr')
    expect(i18nWebappInstance.language).toBe('fr')
    expect(i18nWebappInstance.t('common.cancel')).toBe(resources.fr.common.common.cancel)
    expect(i18nWebappInstance.t('emails:userInvite.subject')).toBe(ENGLISH_INVITE_SUBJECT)
    await i18nWebappInstance.changeLanguage(defaultLanguage)
  })
})
