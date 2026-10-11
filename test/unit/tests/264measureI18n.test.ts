import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'

type Resources = { mapWorkspace: { measure: Record<string, any> } }

const LANGUAGES: Array<[string, Resources]> = [
  ['en', en as Resources],
  ['es', es as Resources],
  ['fr', fr as Resources],
  ['ja', ja as Resources],
  ['mn', mn as Resources],
  ['pt', pt as Resources],
  ['ru', ru as Resources],
]

const CYRILLIC = /[Ѐ-ӿ]/

/**
 * Lists the leaf key paths of a nested object.
 * @param {Record<string, unknown>} value - The object.
 * @param {string} prefix - The path of the object.
 * @returns {string[]} The sorted leaf paths.
 */
const leafPaths = (value: Record<string, unknown>, prefix = ''): string[] => {
  const paths: string[] = []
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object') {
      paths.push(...leafPaths(child as Record<string, unknown>, path))
    } else {
      paths.push(path)
    }
  }
  return paths.sort()
}

describe('Map measure translations (264)', () => {
  test.each(LANGUAGES)('%s has every measure key of en', (_lang, resources) => {
    expect(leafPaths(resources.mapWorkspace.measure)).toEqual(leafPaths((en as Resources).mapWorkspace.measure))
  })

  test('every language keeps the {{value}} placeholder of the perimeter', () => {
    for (const [, resources] of LANGUAGES) {
      expect(resources.mapWorkspace.measure.perimeter).toContain('{{value}}')
    }
  })

  test.each([
    ['ru', ru as Resources],
    ['mn', mn as Resources],
  ])('%s labels and unit symbols are in Cyrillic', (_lang, resources) => {
    expect(resources.mapWorkspace.measure.modes.area).toMatch(CYRILLIC)
    expect(resources.mapWorkspace.measure.unitSymbols.ha).toMatch(CYRILLIC)
  })

  test('unit symbols are never empty', () => {
    for (const [, resources] of LANGUAGES) {
      for (const symbol of Object.values(resources.mapWorkspace.measure.unitSymbols)) {
        expect(String(symbol).trim()).not.toBe('')
      }
    }
  })
})
