import { extractReleaseTag, getUserManualUri } from '@webapp/app/appModules'

const releasesUrl = 'https://github.com/openforis/arena/releases/'
const latestUrl = `${releasesUrl}latest/download/`

describe('User manual URI', () => {
  test.each([
    ['fr', 'arena-user-manual-fr.pdf'],
    ['es-ES', 'arena-user-manual-es.pdf'],
    ['en', 'arena-user-manual-en.pdf'],
    ['ru', 'arena-user-manual-en.pdf'],
    [undefined, 'arena-user-manual-en.pdf'],
  ])('language %s', (lang, fileName) => {
    expect(getUserManualUri(lang, 'v2.10.7')).toBe(`${releasesUrl}download/v2.10.7/${fileName}`)
  })

  test.each([
    ['v2.10.7', `${releasesUrl}download/v2.10.7/`],
    ['v2.10.7-3-g1a2b3c4d5', `${releasesUrl}download/v2.10.7/`],
    ['v2.11.0-beta.1', `${releasesUrl}download/v2.11.0-beta.1/`],
    ['1a2b3c4d5', latestUrl],
    ['', latestUrl],
  ])('app version %s', (appVersion, baseUrl) => {
    expect(getUserManualUri('en', appVersion)).toBe(`${baseUrl}arena-user-manual-en.pdf`)
  })

  test('unknown app version', () => {
    expect(extractReleaseTag(undefined)).toBeNull()
  })
})
