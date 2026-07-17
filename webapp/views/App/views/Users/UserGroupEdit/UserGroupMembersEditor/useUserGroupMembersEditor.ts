import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'

import { useConfirm } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

type SurveyUserType = Record<string, unknown>
type UserGroupMemberType = Record<string, unknown>

interface SurveyUsersResponse {
  list: SurveyUserType[]
}

interface FetchedData {
  members: UserGroupMemberType[]
  otherGroups: UserGroupType[]
  surveyUsers: SurveyUserType[]
}

/**
 * A different group a user currently belongs to: carries both the uuid (needed to remove the user
 * from it on reassignment) and the name (shown in the reassignment confirmation dialog).
 */
interface OtherGroupMembership {
  groupUuid: string
  groupName: string
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
 * Builds a userUuid -> { groupUuid, groupName } map out of a list of other groups and, for each one
 * (same index), its members - used by loadOtherGroupsMembers below. Kept as a standalone function
 * (rather than nested in the hook) to keep function-nesting depth shallow.
 *
 * @param params - The function params.
 * @param params.otherGroups - The groups other than the one being edited.
 * @param params.membersByGroup - Each entry in `otherGroups`' members, at the same index.
 * @returns {Record<string, OtherGroupMembership>} The userUuid -> other group membership map.
 */
const buildOtherGroupsMembersByUserMap = ({
  otherGroups,
  membersByGroup,
}: {
  otherGroups: UserGroupType[]
  membersByGroup: UserGroupMemberType[][]
}): Record<string, OtherGroupMembership> => {
  const map: Record<string, OtherGroupMembership> = {}
  otherGroups.forEach((group, index) => {
    const groupUuid = UserGroup.getUuid(group) as string
    const groupName = UserGroup.getName(group)
    membersByGroup[index].forEach((member) => {
      map[User.getUuid(member) as string] = { groupUuid, groupName }
    })
  })
  return map
}

/**
 * Loads the members of a user group together with the survey's full user list (to build the
 * "add member" dropdown) and, for every user already assigned to a *different* group in the
 * survey, that other group's uuid and name (used to actually move them - remove from the old
 * group, then add to this one - and to show a reassignment confirmation before doing so).
 * Exposes handlers to add (with reassignment confirmation when needed) and remove members.
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
  const [otherGroupsMembersByUser, setOtherGroupsMembersByUser] = useState<Record<string, OtherGroupMembership>>({})

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

  // Builds a userUuid -> { groupUuid, groupName } map, for users already in a *different* group in
  // the survey. The uuid is needed so the reassignment path (onAddMember/addMember below) can
  // remove the user from their old group; the name is only for the confirmation dialog's wording.
  // Same staleness-guard reasoning as the effect above: `otherGroups` can change again before the
  // per-group member fetches resolve.
  const loadOtherGroupsMembers = useCallback(async (): Promise<Record<string, OtherGroupMembership>> => {
    if (otherGroups.length === 0) {
      return {}
    }
    const membersByGroup = await Promise.all(
      otherGroups.map((group) => API.fetchUserGroupMembers({ surveyId, groupUuid: UserGroup.getUuid(group) as string }))
    )
    return buildOtherGroupsMembersByUserMap({ otherGroups, membersByGroup })
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

  const memberUuids: Set<string> = new Set(members.map((member) => User.getUuid(member)))
  const availableUsers = surveyUsers.filter((user) => !memberUuids.has(User.getUuid(user)))

  // Adds the user to this group. When `oldGroupUuid` is given (reassignment case), removes them
  // from that other group FIRST, then adds them to this one, so the user never ends up (even
  // momentarily as far as the persisted end-state is concerned) in both groups at once, matching
  // the remove-then-add sequencing in useUserGroupsSummary.ts's onChangeUserGroup.
  const addMember = useCallback(
    async (userUuid: string, oldGroupUuid?: string) => {
      try {
        dispatch(LoaderActions.showLoader())
        if (oldGroupUuid) {
          await API.removeUserGroupMember({ surveyId, groupUuid: oldGroupUuid, userUuid })
        }
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
      const otherGroupMembership = otherGroupsMembersByUser[userUuid]
      const user = surveyUsers.find((_user) => User.getUuid(_user) === userUuid)
      if (otherGroupMembership) {
        confirm({
          key: 'usersView:userGroup.confirmReassign',
          params: { userName: user ? User.getName(user) : '', groupName: otherGroupMembership.groupName },
          onOk: () => addMember(userUuid, otherGroupMembership.groupUuid),
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
