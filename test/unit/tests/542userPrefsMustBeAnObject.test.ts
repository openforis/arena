import {
  isValidPrefsUpdate,
  sqlPrefsParamIsObject,
  sqlPrefsParamWithoutServerOnlyKeys,
} from '@server/modules/user/serverOnlyPrefs'

import en from '@core/i18n/resources/en/appErrors'
import es from '@core/i18n/resources/es/appErrors'
import fr from '@core/i18n/resources/fr/appErrors'
import ja from '@core/i18n/resources/ja/appErrors'
import mn from '@core/i18n/resources/mn/appErrors'
import pt from '@core/i18n/resources/pt/appErrors'
import ru from '@core/i18n/resources/ru/appErrors'

describe('The prefs of a user stay an object (542)', () => {
  test.each([
    [undefined, true],
    [null, true],
    [{}, true],
    [{ language: 'fr', surveys: { current: 3 } }, true],
    [[1], false],
    [[], false],
    ['{"a":1}', false],
    [5, false],
    [true, false],
  ])('isValidPrefsUpdate(%j) is %s', (prefs, expected) => {
    expect(isValidPrefsUpdate(prefs)).toBe(expected)
  })

  test('the SQL applies the merge only when the parameter is a JSON object', () => {
    expect(sqlPrefsParamIsObject('$1')).toBe("jsonb_typeof(COALESCE($1::jsonb, '{}'::jsonb)) = 'object'")
    // both read the parameter the same way
    expect(sqlPrefsParamWithoutServerOnlyKeys('$1')).toContain("COALESCE($1::jsonb, '{}'::jsonb)")
  })

  test('the error key is translated in the 7 languages', () => {
    for (const messages of [en, es, fr, ja, mn, pt, ru]) {
      expect(typeof (messages as any).userPrefsInvalid).toBe('string')
      expect((messages as any).userPrefsInvalid.length).toBeGreaterThan(5)
    }
  })
})
