import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as UserGroup from '@core/user/userGroup/userGroup'
import { validateUserGroup } from '@core/user/userGroup/userGroupValidator'
import * as Validation from '@core/validation/validation'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useConfirm } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useAuthCanManageUserGroups } from '@webapp/store/user'

// appModules.js is a plain JS module without explicit types: TS infers appModuleUri's parameter shape
// from its default value (appModules.home), which happens to include an `icon` field that userModules
// entries don't have (and that appModuleUri never reads). Cast to the function's own inferred parameter
// type rather than editing that shared, out-of-scope module.
type AppModule = Parameters<typeof appModuleUri>[0]

interface UseEditUserGroupParams {
  groupUuid?: string
}

interface UseEditUserGroupResult {
  ready: boolean
  dirty: boolean
  canEdit: boolean
  canSave: boolean
  canDelete: boolean
  userGroup: UserGroupType
  otherGroupsInSurvey: UserGroupType[]
  onNameChange: (name: string) => void
  onLabelsChange: (labels: Record<string, string>) => void
  onQualifiersChange: (qualifiers: Array<{ name: string; value: string }>) => void
  onSave: () => Promise<void>
  onDelete: () => void
}

/**
 * Loads (when editing an existing group) or initializes (when creating a new one) a user group,
 * and exposes handlers to edit its fields, save it (create or update) and delete it.
 *
 * @param params - The hook params.
 * @param params.groupUuid - Uuid of the group being edited, or undefined when creating a new one.
 * @returns {UseEditUserGroupResult} The user group being edited, its editing/saving/deleting
 *   capabilities, and the handlers to change and persist it.
 */
export const useEditUserGroup = ({ groupUuid }: UseEditUserGroupParams): UseEditUserGroupResult => {
  // NotificationActions/LoaderActions dispatch thunks (functions), not plain actions, but the
  // untyped store JS modules make useDispatch() infer the plain redux `Dispatch<UnknownAction>`
  // type; type it explicitly as a thunk dispatch here, following the precedent in
  // ChainCloneFromSurveyDialog.tsx.
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare.
  const surveyId = useSurveyId() as string
  const canManage = useAuthCanManageUserGroups()

  const [userGroupOriginal, setUserGroupOriginal] = useState<UserGroupType>(UserGroup.newUserGroup())
  const [userGroup, setUserGroup] = useState<UserGroupType>(UserGroup.newUserGroup())
  const [otherGroupsInSurvey, setOtherGroupsInSurvey] = useState<UserGroupType[]>([])
  const [ready, setReady] = useState(!groupUuid)

  const dirty = JSON.stringify(userGroup) !== JSON.stringify(userGroupOriginal)
  const canEdit = canManage
  const canDelete = canManage && Boolean(UserGroup.getUuid(userGroup))
  const canSave = canManage && Validation.isValid(UserGroup.getValidation(userGroup))

  // Pure data fetcher: never sets state itself, so it's safe to call from the reactive effect below
  // via a staleness-guarded `.then()`, following the pattern established in
  // UserGroupQualifiersEditor.tsx / Task 11 and reused in useUserGroupMembersEditor.ts /
  // useUserGroupsSummary.ts.
  const fetchGroups = useCallback(() => API.fetchUserGroups({ surveyId }), [surveyId])

  // Reactive load: re-fetches whenever the group or survey changes. Uses the `.then()`-callback
  // shape with a closure-local staleness guard (not `await` directly in the effect body) so that if
  // `groupUuid`/`surveyId` change again before this fetch resolves (e.g. `onSave`'s `navigate(...,
  // { replace: true })` after creating a group swaps `groupUuid` without remounting the component),
  // the stale response is discarded instead of overwriting newer state - same pattern established
  // in UserGroupQualifiersEditor.tsx / Task 11. Also handles the two gaps the bare `await` version
  // had: a failed fetch (notify + still flip `ready` so the UI shows an error state instead of
  // staying blank forever) and a `groupUuid` that doesn't match any loaded group (stale bookmark or
  // concurrently deleted group: notify + navigate back to the group list instead of leaving
  // `userGroup` as `undefined`, which would throw downstream in UserGroupEdit.tsx).
  useEffect(() => {
    let ignore = false

    fetchGroups()
      .then((allGroups) => {
        if (ignore) return
        setOtherGroupsInSurvey(allGroups.filter((group) => UserGroup.getUuid(group) !== groupUuid))
        if (groupUuid) {
          const found = allGroups.find((group) => UserGroup.getUuid(group) === groupUuid)
          if (found) {
            setUserGroup(found)
            setUserGroupOriginal(found)
            setReady(true)
          } else {
            // NotificationActions.notifyError's untyped implementation destructures `params` with
            // no default, so TS infers it as a required property; pass an empty object explicitly
            // (equivalent to the action creator's own runtime default), following the
            // onRemoveMember precedent in useUserGroupMembersEditor.ts.
            dispatch(NotificationActions.notifyError({ key: 'usersView:userGroup.notFound', params: {} }))
            navigate(appModuleUri(userModules.userGroups as AppModule))
          }
        }
      })
      .catch(() => {
        if (ignore) return
        dispatch(NotificationActions.notifyError({ key: 'appErrors:networkError', params: {} }))
        setReady(true)
      })

    return () => {
      ignore = true
    }
  }, [dispatch, fetchGroups, groupUuid, navigate])

  const updateAndValidate = useCallback(
    async (userGroupUpdated: UserGroupType) => {
      const validation = await validateUserGroup(userGroupUpdated, otherGroupsInSurvey)
      setUserGroup(Validation.assocValidation(validation)(userGroupUpdated))
    },
    [otherGroupsInSurvey]
  )

  const onNameChange = useCallback(
    (name: string) => updateAndValidate(UserGroup.assocName(name)(userGroup)),
    [updateAndValidate, userGroup]
  )
  const onLabelsChange = useCallback(
    (labels: Record<string, string>) => updateAndValidate(UserGroup.assocLabels(labels)(userGroup)),
    [updateAndValidate, userGroup]
  )
  const onQualifiersChange = useCallback(
    (qualifiers: Array<{ name: string; value: string }>) =>
      updateAndValidate(UserGroup.assocQualifiers(qualifiers)(userGroup)),
    [updateAndValidate, userGroup]
  )

  const onSave = useCallback(async () => {
    try {
      dispatch(LoaderActions.showLoader())
      const props = UserGroup.getProps(userGroup)
      const uuid = UserGroup.getUuid(userGroup)
      const saved = uuid
        ? await API.updateUserGroup({ surveyId, groupUuid: uuid, props })
        : await API.createUserGroup({ surveyId, props })
      dispatch(
        NotificationActions.notifyInfo({
          key: 'usersView:userGroup.saveConfirmed',
          params: { name: UserGroup.getName(saved) },
        })
      )
      if (!uuid) {
        navigate(`${appModuleUri(userModules.userGroup as AppModule)}${UserGroup.getUuid(saved)}`, { replace: true })
      } else {
        setUserGroup(saved)
        setUserGroupOriginal(saved)
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }, [dispatch, navigate, surveyId, userGroup])

  const onDelete = useCallback(() => {
    confirm({
      key: 'usersView:userGroup.confirmDelete',
      params: { name: UserGroup.getName(userGroup) },
      onCancel: undefined,
      onOk: async () => {
        try {
          dispatch(LoaderActions.showLoader())
          await API.deleteUserGroup({ surveyId, groupUuid: UserGroup.getUuid(userGroup) as string })
          dispatch(
            NotificationActions.notifyInfo({
              key: 'usersView:userGroup.deleteConfirmed',
              params: { name: UserGroup.getName(userGroup) },
            })
          )
          navigate(appModuleUri(userModules.userGroups as AppModule))
        } finally {
          dispatch(LoaderActions.hideLoader())
        }
      },
    })
  }, [confirm, dispatch, navigate, surveyId, userGroup])

  return {
    ready,
    dirty,
    canEdit,
    canSave,
    canDelete,
    userGroup,
    otherGroupsInSurvey,
    onNameChange,
    onLabelsChange,
    onQualifiersChange,
    onSave,
    onDelete,
  }
}
