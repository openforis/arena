import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as UserGroup from '@core/user/userGroup/userGroup'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'

export type SurveyUserType = Record<string, unknown>

interface SurveyUsersResponse {
  list: SurveyUserType[]
}

interface FetchedData {
  groups: UserGroupType[]
  users: SurveyUserType[]
  groupUuidByUserUuid: Record<string, string>
}

interface UseUserGroupsOverviewResult {
  groups: UserGroupType[]
  users: SurveyUserType[]
  groupUuidByUserUuid: Record<string, string>
  onChangeUserGroup: (userUuid: string, groupUuidNew: string | null) => Promise<void>
  pendingUserUuids: ReadonlySet<string>
}

/**
 * Loads every user group defined in the current survey together with the survey's full user
 * list and, for every user already assigned to a group, that group's uuid (building a
 * userUuid -> groupUuid map used to drive the Kanban board's columns and cards). Exposes a
 * handler to move a user to a different group (or unassign them) by optimistically updating that
 * map and then removing/adding group membership on the server.
 *
 * @returns {UseUserGroupsOverviewResult} The groups, survey users, the userUuid -> groupUuid map,
 *   and the handler to change a user's group.
 */
export const useUserGroupsOverview = (): UseUserGroupsOverviewResult => {
  // NotificationActions dispatches a thunk (function), not a plain action, but the untyped store
  // JS modules make useDispatch() infer the plain redux `Dispatch<UnknownAction>` type; type it
  // explicitly as a thunk dispatch here, following the precedent in useEditUserGroup.ts /
  // useUserGroupMembersEditor.ts.
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare, following the useEditUserGroup.ts precedent.
  const surveyId = useSurveyId() as string

  const [groups, setGroups] = useState<UserGroupType[]>([])
  const [users, setUsers] = useState<SurveyUserType[]>([])
  const [groupUuidByUserUuid, setGroupUuidByUserUuid] = useState<Record<string, string>>({})
  // Users with a group change currently in flight; used to keep their cards from being dragged
  // again until the pending request settles, so overlapping requests for the same user can't race.
  const [pendingUserUuids, setPendingUserUuids] = useState<Set<string>>(new Set())

  // Pure data fetcher: never sets state itself, so it's safe to call from the reactive effect below
  // via a staleness-guarded `.then()`, following the useUserGroupMembersEditor.ts precedent.
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
  // reused in useUserGroupMembersEditor.ts / Task 12.
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

  // Applies (or reverts) a userUuid -> groupUuid mapping change without touching any other entry;
  // shared by the optimistic update below and its error rollback.
  const applyGroupUuidChange = useCallback((userUuid: string, groupUuid: string | null) => {
    setGroupUuidByUserUuid((prev) => {
      const next = { ...prev }
      if (groupUuid) {
        next[userUuid] = groupUuid
      } else {
        delete next[userUuid]
      }
      return next
    })
  }, [])

  const setUserPending = useCallback((userUuid: string, pending: boolean) => {
    setPendingUserUuids((prev) => {
      const next = new Set(prev)
      if (pending) {
        next.add(userUuid)
      } else {
        next.delete(userUuid)
      }
      return next
    })
  }, [])

  // Updates groupUuidByUserUuid optimistically, before the remove/add requests even start, so the
  // dragged card shows in its destination column immediately instead of sitting back in the origin
  // column (see useUserGroupsKanbanDnd's reconcileCrossColumnDrop) for as long as the requests take
  // - which, on a slow connection, used to be very noticeable since it previously waited for a full
  // reload (groups + users + every group's members) on top of the two mutation requests. On failure,
  // the mapping is rolled back to groupUuidOld so the card returns to its original column. Also
  // marks the user pending for the duration of the request (cleared in `finally`, so it's cleared
  // on both success and failure): UserGroupsOverview uses pendingUserUuids to keep the card from
  // being dragged again until this call settles, since a second concurrent call for the same user
  // would race its remove/add requests against this one and could leave the two calls' optimistic
  // updates/rollbacks stomping on each other.
  const onChangeUserGroup = useCallback(
    async (userUuid: string, groupUuidNew: string | null): Promise<void> => {
      const groupUuidOld = groupUuidByUserUuid[userUuid] ?? null
      if (groupUuidOld === groupUuidNew) return

      applyGroupUuidChange(userUuid, groupUuidNew)
      setUserPending(userUuid, true)

      // Tracks whether the old membership was actually removed on the server, so that if the
      // subsequent add fails, the rollback below reflects the user's real server-side state
      // (unassigned) instead of incorrectly restoring them to the old group in the UI.
      let removedOld = false

      try {
        if (groupUuidOld) {
          await API.removeUserGroupMember({ surveyId, groupUuid: groupUuidOld, userUuid })
          removedOld = true
        }
        if (groupUuidNew) {
          await API.addUserGroupMember({ surveyId, groupUuid: groupUuidNew, userUuid })
        }
      } catch (error) {
        applyGroupUuidChange(userUuid, removedOld ? null : groupUuidOld)
        // NotificationActions.notifyError's untyped implementation destructures `params` with no
        // default, so TS infers it as a required property; pass an empty object explicitly
        // (equivalent to the action creator's own runtime default), following the
        // useEditUserGroup.ts precedent.
        dispatch(NotificationActions.notifyError({ key: 'appErrors:networkError', params: {} }))
        throw error
      } finally {
        setUserPending(userUuid, false)
      }
    },
    [applyGroupUuidChange, dispatch, groupUuidByUserUuid, setUserPending, surveyId]
  )

  return { groups, users, groupUuidByUserUuid, onChangeUserGroup, pendingUserUuids }
}
