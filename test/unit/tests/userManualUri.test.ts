import { getUserManualUri } from '@webapp/app/appModules'

const latestUrl = 'https://github.com/openforis/arena/releases/latest/download/'

describe('User manual URI', () => {
  test.each([
    ['fr', 'arena-user-manual-fr.pdf'],
    ['es-ES', 'arena-user-manual-es.pdf'],
    ['en', 'arena-user-manual.pdf'],
    ['ru', 'arena-user-manual.pdf'],
    [undefined, 'arena-user-manual.pdf'],
  ])('language %s', (lang, fileName) => {
    expect(getUserManualUri(lang)).toBe(`${latestUrl}${fileName}`)
  })
})
