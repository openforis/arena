import { useEffect, useState } from 'react'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as UserGroup from '@core/user/userGroup/userGroup'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

export type UserGroupListRow = UserGroupType & { membersCount: number }

interface UseUserGroupsListResult {
  rows: UserGroupListRow[]
  loading: boolean
}

// The user groups list endpoint doesn't return membersCount, so it's fetched separately per group,
// following the useUserGroupsTable.ts precedent (group counts per survey are small).
const fetchUserGroupsListRows = async (surveyId: string): Promise<UserGroupListRow[]> => {
  const groups = await API.fetchUserGroups({ surveyId })

  const membersCounts = await Promise.all(
    groups.map((group) =>
      API.fetchUserGroupMembers({ surveyId, groupUuid: UserGroup.getUuid(group) as string }).then(
        (members) => members.length
      )
    )
  )

  return groups.map((group, index) => ({ ...group, membersCount: membersCounts[index] }))
}

/**
 * Loads every user group defined in the current survey, together with its members count, for
 * display in a plain groups list.
 *
 * @returns {UseUserGroupsListResult} The user groups and a loading flag.
 */
export const useUserGroupsList = (): UseUserGroupsListResult => {
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare, following the useUserGroupsTable.ts precedent.
  const surveyId = useSurveyId() as string

  const [rows, setRows] = useState<UserGroupListRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    fetchUserGroupsListRows(surveyId).then((data) => {
      if (!ignore) {
        setRows(data)
        setLoading(false)
      }
    })

    return () => {
      ignore = true
    }
  }, [surveyId])

  return { rows, loading }
}
