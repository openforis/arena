import type { UserCountRow } from './filterActiveContributors'

type FilterVisibleContributorsParams = {
  userCounts: UserCountRow[]
  canViewAllUsers: boolean
  currentUserUuid: string | null | undefined
}

/**
 * Restricts contributor rows to the current user when the viewer cannot see all users.
 *
 * @param {FilterVisibleContributorsParams} params - Rows and visibility context.
 * @returns {UserCountRow[]} Rows the viewer is allowed to see.
 */
export const filterVisibleContributors = ({
  userCounts,
  canViewAllUsers,
  currentUserUuid,
}: FilterVisibleContributorsParams): UserCountRow[] => {
  if (canViewAllUsers) {
    return userCounts
  }
  if (!currentUserUuid) {
    return []
  }
  const visible: UserCountRow[] = []
  for (const row of userCounts) {
    if (row.owner_uuid === currentUserUuid) {
      visible.push(row)
    }
  }
  return visible
}
