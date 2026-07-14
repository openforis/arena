import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

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

type UserGroupType = Record<string, unknown>

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
  const canDelete = canManage && Boolean(groupUuid)
  const canSave = canManage && Validation.isValid(UserGroup.getValidation(userGroup))

  const loadGroups = useCallback(async () => {
    const allGroups = await API.fetchUserGroups({ surveyId })
    setOtherGroupsInSurvey(allGroups.filter((group) => UserGroup.getUuid(group) !== groupUuid))
    if (groupUuid) {
      const found = allGroups.find((group) => UserGroup.getUuid(group) === groupUuid)
      setUserGroup(found)
      setUserGroupOriginal(found)
      setReady(true)
    }
  }, [groupUuid, surveyId])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

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
