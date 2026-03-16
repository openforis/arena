import * as R from 'ramda'

import { DateFormats, Dates } from '@openforis/arena-core'

const {
  add,
  addHours,
  addMinutes,
  convertDate,
  diffInMinutes,
  diffInHours,
  diffInDays,
  diffInMonths,
  diffInWeeks,
  parse,
  parseISO,
  sub,
  subDays,
  subMonths,
  subYears,
} = Dates

export { add, addHours, addMinutes, convertDate, diffInHours, parse, parseISO, sub, subDays, subMonths, subYears }

import { isBlank } from './stringUtils'

export const formats = {
  dateDefault: DateFormats.dateDisplay,
  dateISO: DateFormats.dateStorage,
  datetimeDefault: DateFormats.datetimeDefault,
  datetimeExport: 'YYYY-MM-DD HH:mm:ss',
  datetimeDisplay: DateFormats.datetimeDisplay,
  datetimeISO: DateFormats.datetimeStorage,
  timeStorage: DateFormats.timeStorage,
} as const

const normalizeDateTimeValue =
  (length: number) =>
  (value: unknown): string =>
    R.pipe(R.ifElse(R.is(String), R.identity, R.toString), (val: string) => val.padStart(length, '0'))(value)

export const format = (date: unknown, format: string = formats.dateDefault): string =>
  Dates.format(date as Date, format)

/**
 * Get a relative date string (e.g., "2 weeks ago").
 */
export const getRelativeDate = (
  i18n: { t: (key: string, params?: Record<string, unknown>) => string },
  date: unknown
): string | null => {
  if (R.isNil(date)) {
    return null
  }

  const now = new Date()

  const formatDiff = (count: number, unit: string): string => i18n.t('common.date.timeDiff', { count, unit })

  const months = diffInMonths(now, date as Date)
  if (months > 0) {
    return format(date, 'DD MMM YYYY')
  }

  const weeks = diffInWeeks(now, date as Date)
  if (weeks > 0) {
    return formatDiff(weeks, 'week')
  }

  const days = diffInDays(now, date as Date)
  if (days > 0) {
    return formatDiff(days, 'day')
  }

  const hours = diffInHours(now, date as Date)
  if (hours > 0) {
    return formatDiff(hours, 'hour')
  }

  const minutes = diffInMinutes(now, date as Date)
  if (minutes > 10) {
    return formatDiff(minutes, 'minute')
  }

  return i18n.t('common.date.aMomentAgo')
}

export const isValidDateObject = Dates.isValidDateObject

/**
 * Checks if the date is valid. Takes into account leap years
 * (i.e. 2015/2/29 is not valid).
 * Used for PostgreSQL date inserts.
 */
export const isValidDate = (year: unknown, month: unknown, day: unknown): boolean => {
  if (isBlank(year) || isBlank(month) || isBlank(day)) {
    return false
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return (
    Boolean(isValidDateObject(date)) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  )
}

/**
 * Check if time (hour:minute) is valid.
 */
export const isValidTime = (hour: unknown = '', minutes: unknown = ''): boolean =>
  isBlank(hour) || isBlank(minutes)
    ? false
    : Number(hour) >= 0 && Number(hour) < 24 && Number(minutes) >= 0 && Number(minutes) < 60

/**
 * Check if a date string is valid for the given format.
 */
export const isValidDateInFormat = (dateStr: string, format: string): boolean => {
  const parsed = parse(dateStr, format as any)
  return isValidDateObject(parsed)
}

export const formatDateISO = (date: unknown): string => format(date, formats.dateISO)

export const formatDateDisplay = (date: unknown): string => format(date, formats.dateDefault)

export const formatDateTimeDefault = (date: unknown): string => format(date, formats.datetimeDefault)

export const formatDateTimeDisplay = (date: unknown): string => format(date, formats.datetimeDisplay)

export const formatDateTimeExport = (date: unknown): string => format(date, formats.datetimeExport)

export const formatTime = (hour: unknown, minute: unknown): string =>
  `${normalizeDateTimeValue(2)(hour)}:${normalizeDateTimeValue(2)(minute)}`

export const parseDateISO = (dateStr: string): unknown => parse(dateStr, formats.dateISO)

export const convertDateFromISOToDisplay = (dateStr: string): unknown =>
  convertDate({
    dateStr,
    formatFrom: formats.dateISO,
    formatTo: formats.dateDefault,
  })

export const convertDateTimeFromISOToDisplay = (dateStr: string): unknown =>
  convertDate({
    dateStr,
    formatFrom: formats.datetimeISO,
    formatTo: formats.datetimeDisplay,
  })

export const nowFormatDefault = (): string => format(Date.now(), formats.datetimeDefault)
