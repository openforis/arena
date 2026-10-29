import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

const flatten = (value: unknown, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') result[path] = child
    else Object.assign(result, flatten(child, path))
  }
  return result
}

const placeholders = (text: string): string[] =>
  (text.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort()

const screenshotStrings = (lang: string): Record<string, string> => flatten(resources[lang].mapWorkspace.screenshot)

const enStrings = screenshotStrings('en')

describe('Screenshot i18n (289)', () => {
  test('English has the screenshot strings', () => {
    expect(Object.keys(enStrings)).toHaveLength(42)
    expect(enStrings.menuItem).toBe('Screenshot to plot record…')
    expect(enStrings['notices.tilesMissing']).toContain('{{count}}')
  })

  test.each(['es', 'fr', 'ja', 'mn', 'pt', 'ru'])('%s has the same keys and placeholders as English', (lang) => {
    const strings = screenshotStrings(lang)
    expect(Object.keys(strings).sort()).toEqual(Object.keys(enStrings).sort())
    for (const [key, text] of Object.entries(strings)) {
      expect(text.trim()).not.toBe('')
      expect(placeholders(text)).toEqual(placeholders(enStrings[key]))
    }
  })

  test.each(['ru', 'mn'])('%s is written in Cyrillic', (lang) => {
    for (const text of Object.values(screenshotStrings(lang))) {
      expect(text).toMatch(/[Ѐ-ӿ]/)
    }
  })
})
