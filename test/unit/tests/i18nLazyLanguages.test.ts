import { resources } from '@core/i18n/i18nFactory'
import { defaultLanguage, supportedLanguages } from '@core/i18n/uiLanguages'
import i18nInstance, { languageLoaders } from '@webapp/store/system/i18n/i18nInstance'

const sorted = (values: string[]): string[] => [...values].sort((a, b) => a.localeCompare(b))

describe('UI languages loaded when used (webapp)', () => {
  test('the UI languages are the ones of the factory and of the webapp loaders', () => {
    expect(sorted(Object.keys(resources))).toEqual(sorted(supportedLanguages))
    expect(sorted([defaultLanguage, ...Object.keys(languageLoaders)])).toEqual(sorted(supportedLanguages))
  })

  test('only English is loaded at startup', () => {
    expect(i18nInstance.hasResourceBundle('en', 'common')).toBe(true)
    expect(i18nInstance.hasResourceBundle('fr', 'common')).toBe(false)
  })

  test('a language is loaded when changed to, missing namespaces fall back to English', async () => {
    await i18nInstance.changeLanguage('fr')
    expect(i18nInstance.language).toBe('fr')
    expect(i18nInstance.hasResourceBundle('fr', 'common')).toBe(true)
    expect(i18nInstance.t('common.cancel')).toBe(resources.fr.common.common.cancel)
    // emails are in English only
    expect(i18nInstance.t('emails:userInvite.subject')).toBe('You have been invited to Open Foris Arena!')
    await i18nInstance.changeLanguage(defaultLanguage)
  })
})
