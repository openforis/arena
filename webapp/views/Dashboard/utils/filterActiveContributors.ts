export type UserCountRow = {
  owner_uuid?: string
  owner_name?: string
  owner_email?: string
  count?: string | number
}

/**
 * Keeps the contributors with at least one record (the API already applies the selected period).
 *
 * @param {UserCountRow[]} userCounts - The per-user record counts.
 * @returns {UserCountRow[]} The rows with a count greater than zero.
 */
export const filterActiveContributors = (userCounts: UserCountRow[]): UserCountRow[] => {
  const active: UserCountRow[] = []
  for (const row of userCounts) {
    if (Number(row.count ?? 0) > 0) {
      active.push(row)
    }
  }
  return active
}
