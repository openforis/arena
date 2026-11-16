import { getPrivacyNoticeUri } from '@webapp/app/appModules'

const baseUrl = 'https://www.fao.org/contact-us/data-protection-and-privacy/'

describe('Privacy notice URI', () => {
  test.each([
    ['en', 'en'],
    ['fr', 'fr'],
    ['es-ES', 'es'],
    ['ru', 'ru'],
    ['ja', 'en'],
    [undefined, 'en'],
  ])('language %s', (lang, noticeLang) => {
    expect(getPrivacyNoticeUri(lang)).toBe(`${baseUrl}${noticeLang}/`)
  })
})
