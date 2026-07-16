import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import * as UserGroup from '@core/user/userGroup/userGroup'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui'

export type SurveyUserType = Record<string, unknown>
export type UserGroupType = Record<string, unknown>

interface SurveyUsersResponse {
  list: SurveyUserType[]
}

interface FetchedData {
  groups: UserGroupType[]
  users: SurveyUserType[]
  groupUuidByUserUuid: Record<string, string>
}

interface UseUserGroupsSummaryResult {
  groups: UserGroupType[]
  users: SurveyUserType[]
  groupUuidByUserUuid: Record<string, string>
  onChangeUserGroup: (userUuid: string, groupUuidNew: string | null) => Promise<void>
  reload: () => Promise<void>
}

/**
 * Loads every user group defined in the current survey together with the survey's full user
 * list and, for every user already assigned to a group, that group's uuid (building a
 * userUuid -> groupUuid map used to drive the Kanban board's columns and cards). Exposes a
 * handler to move a user to a different group (or unassign them) by removing/adding group
 * membership and reloading.
 *
 * @returns {UseUserGroupsSummaryResult} The groups, survey users, the userUuid -> groupUuid map,
 *   and the handler to change a user's group.
 */
export const useUserGroupsSummary = (): UseUserGroupsSummaryResult => {
  // LoaderActions dispatches thunks (functions), not plain actions, but the untyped store JS
  // modules make useDispatch() infer the plain redux `Dispatch<UnknownAction>` type; type it
  // explicitly as a thunk dispatch here, following the precedent in useEditUserGroup.ts /
  // useUserGroupMembersEditor.ts.
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare, following the useEditUserGroup.ts precedent.
  const surveyId = useSurveyId() as string

  const [groups, setGroups] = useState<UserGroupType[]>([])
  const [users, setUsers] = useState<SurveyUserType[]>([])
  const [groupUuidByUserUuid, setGroupUuidByUserUuid] = useState<Record<string, string>>({})

  // Pure data fetcher: never sets state itself, so it's safe to call both from the reactive effect
  // below (via a staleness-guarded `.then()`) and from the imperative `reload` used by
  // onChangeUserGroup, following the useUserGroupMembersEditor.ts precedent.
  const fetchData = useCallback(async (): Promise<FetchedData> => {
    const [groupsList, { data: usersRes }] = await Promise.all([
      API.fetchUserGroups({ surveyId }),
      axios.get<SurveyUsersResponse>(`/api/survey/${surveyId}/users`),
    ])
    const membersByGroup = await Promise.all(
      groupsList.map((group) => API.fetchUserGroupMembers({ surveyId, groupUuid: UserGroup.getUuid(group) as string }))
    )
    const map: Record<string, string> = {}
    groupsList.forEach((group, index) => {
      membersByGroup[index].forEach((member: Record<string, unknown>) => {
        map[member.uuid as string] = UserGroup.getUuid(group) as string
      })
    })
    return { groups: groupsList, users: usersRes.list, groupUuidByUserUuid: map }
  }, [surveyId])

  // Reactive load: re-fetches whenever the survey changes. Uses the `.then()`-callback shape with
  // a closure-local staleness guard (not `await` directly in the effect body) so that if `surveyId`
  // changes again before this fetch resolves, the stale response is discarded instead of
  // overwriting newer state - same pattern established in UserGroupQualifiersEditor.tsx / Task 11,
  // reused in useUserGroupMembersEditor.ts / Task 12. No loader dispatch here (matching the
  // useUserGroupMembersEditor.ts precedent): the loader is only shown around the imperative
  // add/remove-driven reload below, not the initial reactive load.
  useEffect(() => {
    let ignore = false

    fetchData().then((data) => {
      if (!ignore) {
        setGroups(data.groups)
        setUsers(data.users)
        setGroupUuidByUserUuid(data.groupUuidByUserUuid)
      }
    })

    return () => {
      ignore = true
    }
  }, [fetchData])

  // Reload used by the imperative onChangeUserGroup handler below: called from an event handler
  // (not directly from an effect body), so there's no risk of setting state after a superseded
  // effect run - matches the reload precedent in useUserGroupMembersEditor.ts.
  const reload = useCallback(async (): Promise<void> => {
    const data = await fetchData()
    setGroups(data.groups)
    setUsers(data.users)
    setGroupUuidByUserUuid(data.groupUuidByUserUuid)
  }, [fetchData])

  const onChangeUserGroup = useCallback(
    async (userUuid: string, groupUuidNew: string | null): Promise<void> => {
      const groupUuidOld = groupUuidByUserUuid[userUuid]
      try {
        dispatch(LoaderActions.showLoader())
        if (groupUuidOld) {
          await API.removeUserGroupMember({ surveyId, groupUuid: groupUuidOld, userUuid })
        }
        if (groupUuidNew) {
          await API.addUserGroupMember({ surveyId, groupUuid: groupUuidNew, userUuid })
        }
        await reload()
      } finally {
        dispatch(LoaderActions.hideLoader())
      }
    },
    [dispatch, groupUuidByUserUuid, reload, surveyId]
  )

  return { groups, users, groupUuidByUserUuid, onChangeUserGroup, reload }
}
