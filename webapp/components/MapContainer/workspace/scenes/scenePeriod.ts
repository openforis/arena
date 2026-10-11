import type { ScenePeriod, ScenePeriodMonths } from './sceneTypes'

export const SCENE_PERIOD_OPTIONS: ScenePeriodMonths[] = [1, 3, 6]
export const MAX_SCENE_PERIOD_MONTHS: ScenePeriodMonths = 6
export const DEFAULT_SCENE_PERIOD_MONTHS: ScenePeriodMonths = MAX_SCENE_PERIOD_MONTHS

const MONTHS_PER_YEAR = 12
const FALLBACK_LOCALE = 'en'
const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/**
 * Returns the longest allowed period (1, 3 or 6 months) that is not longer than the requested one.
 *
 * @param {number} months - Requested number of months.
 * @returns {ScenePeriodMonths} Allowed number of months, at least 1.
 */
export const normalizePeriodMonths = (months: number): ScenePeriodMonths => {
  let result: ScenePeriodMonths = SCENE_PERIOD_OPTIONS[0]
  for (const option of SCENE_PERIOD_OPTIONS) {
    if (option <= months) result = option
  }
  return result
}

/**
 * Returns the number of days of a month in UTC.
 *
 * @param {number} year - Full year.
 * @param {number} monthIndex - Month index, 0 is January.
 * @returns {number} Number of days of the month.
 */
const daysInMonth = (year: number, monthIndex: number): number =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

/**
 * Formats a month as YYYY-MM.
 *
 * @param {number} year - Full year.
 * @param {number} monthIndex - Month index, 0 is January.
 * @returns {string} Month key.
 */
const toMonthKey = (year: number, monthIndex: number): string => `${year}-${String(monthIndex + 1).padStart(2, '0')}`

/**
 * Returns the absolute month number (year × 12 + month index) of a date in UTC.
 *
 * @param {Date} date - Date.
 * @returns {number} Absolute month number.
 */
const toAbsoluteMonth = (date: Date): number => date.getUTCFullYear() * MONTHS_PER_YEAR + date.getUTCMonth()

/**
 * Returns the search window: from 00:00 UTC of the same day N months back (clamped to the end of shorter
 * months) to now.
 *
 * @param {number} months - Requested number of months; normalized to 1, 3 or 6.
 * @param {Date} now - Current time (injected so tests and renders stay pure).
 * @returns {ScenePeriod} The period.
 */
export const getScenePeriod = (months: number, now: Date): ScenePeriod => {
  const normalized = normalizePeriodMonths(months)
  const startMonth = toAbsoluteMonth(now) - normalized
  const year = Math.floor(startMonth / MONTHS_PER_YEAR)
  const monthIndex = startMonth - year * MONTHS_PER_YEAR
  const day = Math.min(now.getUTCDate(), daysInMonth(year, monthIndex))
  return { months: normalized, start: new Date(Date.UTC(year, monthIndex, day)), end: new Date(now.getTime()) }
}

/**
 * Lists the calendar months (YYYY-MM, UTC) touched by a period, oldest first.
 *
 * @param {ScenePeriod} period - The period.
 * @returns {string[]} Month keys.
 */
export const getPeriodMonthKeys = (period: ScenePeriod): string[] => {
  const keys: string[] = []
  const lastMonth = toAbsoluteMonth(period.end)
  for (let month = toAbsoluteMonth(period.start); month <= lastMonth; month += 1) {
    const year = Math.floor(month / MONTHS_PER_YEAR)
    keys.push(toMonthKey(year, month - year * MONTHS_PER_YEAR))
  }
  return keys
}

/**
 * Tells whether an ISO datetime falls inside a period (both ends included).
 *
 * @param {string} datetime - ISO 8601 datetime.
 * @param {ScenePeriod} period - The period.
 * @returns {boolean} True when inside.
 */
export const isInPeriod = (datetime: string, period: ScenePeriod): boolean => {
  const time = Date.parse(datetime)
  return Number.isFinite(time) && time >= period.start.getTime() && time <= period.end.getTime()
}

/**
 * Creates a UTC date format for a locale, falling back to English for an invalid locale tag.
 *
 * @param {string} locale - BCP 47 locale (the i18n language).
 * @param {Intl.DateTimeFormatOptions} options - Format options.
 * @returns {Intl.DateTimeFormat} The format.
 */
const createDateFormat = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const utcOptions: Intl.DateTimeFormatOptions = { ...options, timeZone: 'UTC' }
  try {
    return new Intl.DateTimeFormat(locale, utcOptions)
  } catch {
    return new Intl.DateTimeFormat(FALLBACK_LOCALE, utcOptions)
  }
}

/**
 * Formats a scene datetime as a short UTC date, e.g. "Oct 7, 2026".
 *
 * @param {string} datetime - ISO 8601 datetime.
 * @param {string} locale - BCP 47 locale.
 * @returns {string} Formatted date.
 */
export const formatSceneDate = (datetime: string, locale: string): string =>
  createDateFormat(locale, DAY_FORMAT).format(new Date(datetime))

/**
 * Formats a period as a date range, e.g. "Apr 11 – Oct 11, 2026".
 *
 * @param {ScenePeriod} period - The period.
 * @param {string} locale - BCP 47 locale.
 * @returns {string} Formatted range.
 */
export const formatPeriodRange = (period: ScenePeriod, locale: string): string =>
  createDateFormat(locale, DAY_FORMAT).formatRange(period.start, period.end)

/**
 * Formats a YYYY-MM key as a short month name, optionally with the year.
 *
 * @param {string} monthKey - Month key, YYYY-MM.
 * @param {string} locale - BCP 47 locale.
 * @param {boolean} withYear - True to add the year.
 * @returns {string} Formatted month, e.g. "Apr" or "Apr 2026".
 */
export const formatMonthLabel = (monthKey: string, locale: string, withYear: boolean): string => {
  const [year, month] = monthKey.split('-').map(Number)
  const options: Intl.DateTimeFormatOptions = withYear ? { month: 'short', year: 'numeric' } : { month: 'short' }
  return createDateFormat(locale, options).format(new Date(Date.UTC(year, month - 1, 1)))
}
