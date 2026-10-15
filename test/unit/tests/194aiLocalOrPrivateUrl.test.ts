import { isLocalOrPrivateUrl, isOrgHostedUrl, withDefaultHttpScheme } from '@common/ai/localServerAddress'
import { LANGUAGES, namespaceByLanguage } from '../utils/i18nParity'

describe('isLocalOrPrivateUrl', () => {
  test.each([
    'http://localhost:1234/v1',
    'http://LOCALHOST:1234/v1',
    'http://lmstudio.localhost/v1',
    'http://127.0.0.1:1234/v1',
    'http://127.8.9.10/v1',
    'http://[::1]:1234/v1',
    'http://0.0.0.0:1234/v1',
    'http://[::]:1234/v1',
    'http://10.1.2.3:8000/v1',
    'http://172.16.0.1/v1',
    'http://172.31.255.254/v1',
    'http://192.168.1.20:1234/v1',
    'http://169.254.10.10/v1',
    'http://100.64.0.1/v1',
    'http://[fd00::1]:8080/v1',
    'http://[fe80::1]/v1',
    'http://printer.local:1234/v1',
    'localhost:1234/v1',
    '  http://192.168.1.20:1234/v1  ',
    'https://10.0.0.5/v1',
  ])('%s is local or private', (url) => {
    expect(isLocalOrPrivateUrl(url)).toBe(true)
  })

  test.each([
    'https://api.openai.com/v1',
    'https://openrouter.ai/api/v1',
    'http://172.32.0.1/v1',
    'http://8.8.8.8/v1',
    'https://example.org',
    'openrouter.ai/api/v1',
    '',
    '   ',
    'not a url',
    'ftp://localhost/v1',
  ])('%s is not', (url) => {
    expect(isLocalOrPrivateUrl(url)).toBe(false)
  })

  test('non-strings are not', () => {
    expect(isLocalOrPrivateUrl(null as unknown as string)).toBe(false)
    expect(isLocalOrPrivateUrl(undefined as unknown as string)).toBe(false)
  })
})

describe('withDefaultHttpScheme', () => {
  test('adds http:// only when no scheme is typed', () => {
    expect(withDefaultHttpScheme('localhost:1234/v1')).toBe('http://localhost:1234/v1')
    expect(withDefaultHttpScheme(' https://a.org/v1 ')).toBe('https://a.org/v1')
    expect(withDefaultHttpScheme('ftp://a.org')).toBe('ftp://a.org')
  })
})

describe('isOrgHostedUrl', () => {
  const allowlist = ['http://10.0.0.5:8000/v1']

  test('an allowlisted server, with or without scheme', () => {
    expect(isOrgHostedUrl('http://10.0.0.5:8000/v1', allowlist)).toBe(true)
    expect(isOrgHostedUrl('10.0.0.5:8000/v1', allowlist)).toBe(true)
  })

  test('other addresses and empty input', () => {
    expect(isOrgHostedUrl('http://10.0.0.6:8000/v1', allowlist)).toBe(false)
    expect(isOrgHostedUrl('http://10.0.0.5:8000/v1', [])).toBe(false)
    expect(isOrgHostedUrl('', allowlist)).toBe(false)
  })
})

describe('aiBaseUrlNotAllowed points to the local AI server', () => {
  const errorsByLang = namespaceByLanguage('appErrors')
  const localServerNames: Record<string, string> = {
    en: 'Local AI server',
    es: 'Servidor de IA local',
    fr: "Serveur d'IA local",
    ja: 'ローカル AI サーバー',
    mn: 'Дотоод AI сервер',
    pt: 'Servidor de IA local',
    ru: 'Локальный сервер ИИ',
  }

  test('every language of the app has its expected name (a new language needs one here)', () => {
    expect(Object.keys(localServerNames).sort()).toEqual([...LANGUAGES].sort())
  })

  test.each(LANGUAGES)('%s', (lang) => {
    expect(errorsByLang[lang].aiBaseUrlNotAllowed).toContain(localServerNames[lang])
  })
})
