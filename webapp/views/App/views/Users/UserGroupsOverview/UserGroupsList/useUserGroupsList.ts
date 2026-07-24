import { useEffect, useState } from 'react'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

interface UseUserGroupsListResult {
  rows: UserGroupType[]
  loading: boolean
}

/**
 * Loads every user group defined in the current survey, for display in a plain groups list.
 *
 * @returns {UseUserGroupsListResult} The user groups and a loading flag.
 */
export const useUserGroupsList = (): UseUserGroupsListResult => {
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare, following the useUserGroupsTable.ts precedent.
  const surveyId = useSurveyId() as string

  const [rows, setRows] = useState<UserGroupType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    API.fetchUserGroups({ surveyId }).then((data) => {
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
