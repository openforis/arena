/**
 * Sentinel-2 scene period: 1, 3 or 6 months back (never more), UTC month keys and date formatting.
 */
import {
  formatMonthLabel,
  formatPeriodRange,
  formatSceneDate,
  getPeriodMonthKeys,
  getScenePeriod,
  isInPeriod,
  normalizePeriodMonths,
  SCENE_PERIOD_OPTIONS,
} from '@webapp/components/MapContainer/workspace/scenes/scenePeriod'

const NOW = new Date('2026-10-11T10:30:00Z')

describe('Sentinel-2 scene period (275)', () => {
  test('offers 1, 3 and 6 months and never more than 6', () => {
    expect(SCENE_PERIOD_OPTIONS).toEqual([1, 3, 6])
    expect(normalizePeriodMonths(12)).toBe(6)
    expect(normalizePeriodMonths(6)).toBe(6)
    expect(normalizePeriodMonths(4)).toBe(3)
    expect(normalizePeriodMonths(0)).toBe(1)
    expect(normalizePeriodMonths(Number.NaN)).toBe(1)
  })

  test('starts at 00:00 UTC of the same day N months back and ends now', () => {
    expect(getScenePeriod(1, NOW).start.toISOString()).toBe('2026-09-11T00:00:00.000Z')
    expect(getScenePeriod(3, NOW).start.toISOString()).toBe('2026-07-11T00:00:00.000Z')
    const sixMonths = getScenePeriod(6, NOW)
    expect(sixMonths.months).toBe(6)
    expect(sixMonths.start.toISOString()).toBe('2026-04-11T00:00:00.000Z')
    expect(sixMonths.end.toISOString()).toBe('2026-10-11T10:30:00.000Z')
    expect(getScenePeriod(12, NOW).months).toBe(6)
  })

  test('crosses the year and clamps to the end of shorter months', () => {
    expect(getScenePeriod(6, new Date('2027-01-15T08:00:00Z')).start.toISOString()).toBe('2026-07-15T00:00:00.000Z')
    expect(getScenePeriod(1, new Date('2026-03-31T12:00:00Z')).start.toISOString()).toBe('2026-02-28T00:00:00.000Z')
    expect(getScenePeriod(1, new Date('2028-03-31T12:00:00Z')).start.toISOString()).toBe('2028-02-29T00:00:00.000Z')
  })

  test('lists every calendar month of the period', () => {
    expect(getPeriodMonthKeys(getScenePeriod(6, NOW))).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ])
    expect(getPeriodMonthKeys(getScenePeriod(3, new Date('2027-02-15T00:00:00Z')))).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ])
  })

  test('accepts datetimes inside the period only', () => {
    const period = getScenePeriod(1, NOW)
    expect(isInPeriod('2026-09-11T00:00:00.000Z', period)).toBe(true)
    expect(isInPeriod('2026-10-11T10:30:00.000Z', period)).toBe(true)
    expect(isInPeriod('2026-09-10T23:59:59.999Z', period)).toBe(false)
    expect(isInPeriod('2026-10-11T10:30:00.001Z', period)).toBe(false)
    expect(isInPeriod('not a date', period)).toBe(false)
  })

  test('formats dates in UTC for the user language', () => {
    expect(formatSceneDate('2026-10-07T23:30:00.000Z', 'en')).toBe('Oct 7, 2026')
    expect(formatSceneDate('2026-10-07T08:00:00.000Z', 'not a locale!')).toBe('Oct 7, 2026')
    expect(formatMonthLabel('2026-04', 'en', false)).toBe('Apr')
    expect(formatMonthLabel('2026-04', 'en', true)).toBe('Apr 2026')
    expect(formatPeriodRange(getScenePeriod(6, NOW), 'en')).toMatch(/^Apr 11\s–\sOct 11, 2026$/)
  })
})
