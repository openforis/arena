export type MapPeriod = { year: number; month: number; yearTo?: number; monthTo?: number }

/**
 * Returns a sortable number identifying a Planet period (monthly or biannual).
 * @param {MapPeriod} period - The period.
 * @returns {number} The period value.
 */
export const getPeriodValue = ({ year, month, yearTo }: MapPeriod): number => {
  if (yearTo) return year * 2 + (month <= 6 ? 0 : 1)
  return year * 12 + month
}

/**
 * Formats a Planet period for the period select.
 * @param {MapPeriod} period - The period.
 * @returns {string} E.g. "2021 - 12" or "2020 - 6 / 2020 - 8".
 */
export const formatPeriodLabel = ({ year, month, yearTo, monthTo }: MapPeriod): string =>
  `${year} - ${month}` + (yearTo ? ` / ${yearTo} - ${monthTo}` : '')

/**
 * Indexes periods by their value.
 * @param {MapPeriod[]} periods - The periods.
 * @returns {Record<number, MapPeriod>} Periods by value.
 */
export const indexPeriodsByValue = (periods: MapPeriod[]): Record<number, MapPeriod> => {
  const result: Record<number, MapPeriod> = {}
  for (const period of periods) {
    result[getPeriodValue(period)] = period
  }
  return result
}
