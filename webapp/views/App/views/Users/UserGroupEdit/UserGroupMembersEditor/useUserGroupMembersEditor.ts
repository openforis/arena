import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'

import { useConfirm } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

type SurveyUserType = Record<string, unknown>
type UserGroupMemberType = Record<string, unknown>
type UserGroupType = Record<string, unknown>

interface SurveyUsersResponse {
  list: SurveyUserType[]
}

interface FetchedData {
  members: UserGroupMemberType[]
  otherGroups: UserGroupType[]
  surveyUsers: SurveyUserType[]
}

interface UseUserGroupMembersEditorParams {
  groupUuid: string
}

interface UseUserGroupMembersEditorResult {
  members: UserGroupMemberType[]
  availableUsers: SurveyUserType[]
  onAddMember: (userUuid: string) => void
  onRemoveMember: (userUuid: string) => Promise<void>
}

/**
 * Loads the members of a user group together with the survey's full user list (to build the
 * "add member" dropdown) and, for every user already assigned to a *different* group in the
 * survey, the name of that other group (used to show a reassignment confirmation before moving
 * them). Exposes handlers to add (with reassignment confirmation when needed) and remove members.
 *
 * @param params - The hook params.
 * @param params.groupUuid - Uuid of the group being edited.
 * @returns {UseUserGroupMembersEditorResult} The group's members, the users available to be
 *   added, and the add/remove handlers.
 */
export const useUserGroupMembersEditor = ({
  groupUuid,
}: UseUserGroupMembersEditorParams): UseUserGroupMembersEditorResult => {
  // NotificationActions/LoaderActions dispatch thunks (functions), not plain actions, but the
  // untyped store JS modules make useDispatch() infer the plain redux `Dispatch<UnknownAction>`
  // type; type it explicitly as a thunk dispatch here, following the precedent in
  // useEditUserGroup.ts / ChainCloneFromSurveyDialog.tsx.
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const confirm = useConfirm()
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare, following the useEditUserGroup.ts precedent.
  const surveyId = useSurveyId() as string

  const [members, setMembers] = useState<UserGroupMemberType[]>([])
  const [surveyUsers, setSurveyUsers] = useState<SurveyUserType[]>([])
  const [otherGroups, setOtherGroups] = useState<UserGroupType[]>([])
  const [otherGroupsMembersByUser, setOtherGroupsMembersByUser] = useState<Record<string, string>>({})

  // Pure data fetcher: never sets state itself, so it's safe to call both from the reactive effect
  // below (via a staleness-guarded `.then()`) and from the imperative `reload` used by the
  // add/remove handlers.
  const fetchData = useCallback(async (): Promise<FetchedData> => {
    const [membersList, allGroups, { data: surveyUsersRes }] = await Promise.all([
      API.fetchUserGroupMembers({ surveyId, groupUuid }),
      API.fetchUserGroups({ surveyId }),
      axios.get<SurveyUsersResponse>(`/api/survey/${surveyId}/users`),
    ])
    return {
      members: membersList,
      otherGroups: allGroups.filter((group) => UserGroup.getUuid(group) !== groupUuid),
      surveyUsers: surveyUsersRes.list,
    }
  }, [groupUuid, surveyId])

  // Reactive load: re-fetches whenever the group or survey changes. Uses the `.then()`-callback
  // shape with a closure-local staleness guard (not `await` directly in the effect body) so that if
  // `groupUuid`/`surveyId` change again before this fetch resolves, the stale response is discarded
  // instead of overwriting newer state - same pattern established in
  // UserGroupQualifiersEditor.tsx / Task 11.
  useEffect(() => {
    let ignore = false

    fetchData().then((data) => {
      if (!ignore) {
        setMembers(data.members)
        setOtherGroups(data.otherGroups)
        setSurveyUsers(data.surveyUsers)
      }
    })

    return () => {
      ignore = true
    }
  }, [fetchData])

  // Reload used by the imperative add/remove handlers below: called from event handlers (not
  // directly from an effect body), so there's no risk of setting state after a superseded effect
  // run - matches the onSave/onDelete precedent in useEditUserGroup.ts.
  const reload = useCallback(async (): Promise<void> => {
    const data = await fetchData()
    setMembers(data.members)
    setOtherGroups(data.otherGroups)
    setSurveyUsers(data.surveyUsers)
  }, [fetchData])

  // Builds a userUuid -> group name map, for users already in a *different* group in the survey.
  // Same staleness-guard reasoning as the effect above: `otherGroups` can change again before the
  // per-group member fetches resolve.
  const loadOtherGroupsMembers = useCallback((): Promise<Record<string, string>> => {
    if (otherGroups.length === 0) {
      return Promise.resolve({})
    }
    return Promise.all(
      otherGroups.map((group) => API.fetchUserGroupMembers({ surveyId, groupUuid: UserGroup.getUuid(group) as string }))
    ).then((membersByGroup) => {
      const map: Record<string, string> = {}
      otherGroups.forEach((group, index) => {
        membersByGroup[index].forEach((member) => {
          map[User.getUuid(member) as string] = UserGroup.getName(group)
        })
      })
      return map
    })
  }, [otherGroups, surveyId])

  useEffect(() => {
    let ignore = false

    loadOtherGroupsMembers().then((map) => {
      if (!ignore) {
        setOtherGroupsMembersByUser(map)
      }
    })

    return () => {
      ignore = true
    }
  }, [loadOtherGroupsMembers])

  const memberUuids = members.map((member) => User.getUuid(member))
  const availableUsers = surveyUsers.filter((user) => !memberUuids.includes(User.getUuid(user)))

  const addMember = useCallback(
    async (userUuid: string) => {
      try {
        dispatch(LoaderActions.showLoader())
        await API.addUserGroupMember({ surveyId, groupUuid, userUuid })
        await reload()
      } finally {
        dispatch(LoaderActions.hideLoader())
      }
    },
    [dispatch, groupUuid, reload, surveyId]
  )

  const onAddMember = useCallback(
    (userUuid: string) => {
      const otherGroupName = otherGroupsMembersByUser[userUuid]
      const user = surveyUsers.find((_user) => User.getUuid(_user) === userUuid)
      if (otherGroupName) {
        confirm({
          key: 'usersView:userGroup.confirmReassign',
          params: { userName: user ? User.getName(user) : '', groupName: otherGroupName },
          onOk: () => addMember(userUuid),
          onCancel: undefined,
        })
      } else {
        addMember(userUuid)
      }
    },
    [addMember, confirm, otherGroupsMembersByUser, surveyUsers]
  )

  const onRemoveMember = useCallback(
    async (userUuid: string) => {
      try {
        dispatch(LoaderActions.showLoader())
        await API.removeUserGroupMember({ surveyId, groupUuid, userUuid })
        await reload()
        // NotificationActions.notifyInfo's untyped implementation destructures `params` with no
        // default, so TS infers it as a required property; pass an empty object explicitly
        // (equivalent to the action creator's own runtime default) rather than widen its shared type.
        dispatch(NotificationActions.notifyInfo({ key: 'common.done', params: {} }))
      } finally {
        dispatch(LoaderActions.hideLoader())
      }
    },
    [dispatch, groupUuid, reload, surveyId]
  )

  return { members, availableUsers, onAddMember, onRemoveMember }
}
