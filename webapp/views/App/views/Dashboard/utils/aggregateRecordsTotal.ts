type CountRow = { count?: string | number }

/**
 * Sums the count field of the given rows (counts can be strings when coming from the DB).
 *
 * @param {CountRow[]} counts - The count rows.
 * @returns {number} The total count.
 */
export const aggregateRecordsTotal = (counts: CountRow[]): number => {
  let total = 0
  for (const row of counts) {
    total += Number(row.count ?? 0)
  }
  return total
}
