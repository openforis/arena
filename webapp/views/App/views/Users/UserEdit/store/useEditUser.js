import { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import * as R from 'ramda'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import { useQuery } from '@webapp/components/hooks'
import { appModuleUri, userModules } from '@webapp/app/appModules'
import * as API from '@webapp/service/api'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'
import { NotificationActions } from '@webapp/store/ui'

import { useActions } from './actions'

const getEditCapabilities = ({ user, surveyInfo, ready, userToUpdate = null }) => {
  const userToUpdateUuid = User.getUuid(userToUpdate)
  const newUser = !userToUpdateUuid
  const isUserAcceptPending = userToUpdate && !User.hasAccepted(userToUpdate)
  const canEditUser =
    ready &&
    ((newUser && Authorizer.canCreateUsers(user)) ||
      (userToUpdate && !isUserAcceptPending && Authorizer.canEditUser(user, surveyInfo, userToUpdate)))
  const canEditName = canEditUser
  const canEditEmail = canEditUser && (!userToUpdate || Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate))
  const canEditGroup = canEditUser && (!userToUpdate || Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate))
  const canRemove = Authorizer.canRemoveUser(user, surveyInfo, userToUpdate)
  const canEdit = canEditName || canEditEmail || canEditGroup
  const canViewSystemAdmin = User.isSystemAdmin(user)
  const canEditSystemAdmin = canViewSystemAdmin && !User.isEqual(userToUpdate)(user)
  const canViewSurveyManager = User.isSurveyManager(user)
  const canEditSurveyManager = Authorizer.canEditUserSurveyManager(user)
  const canEditMaxSurveys = Authorizer.canEditUserMaxSurveys(user)
  const canManageTwoFactorDevices = Authorizer.canManageUser2FADevices(user)

  const validation = User.getValidation(userToUpdate)
  const canSave = Validation.isValid(validation)
  const canViewEmail = User.isEqual(user)(userToUpdate) || Authorizer.canViewOtherUsersEmail({ user, surveyInfo })

  return {
    canEdit,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    canSave,
    canViewEmail,
    canEditMaxSurveys,
    canViewSystemAdmin,
    canEditSystemAdmin,
    canViewSurveyManager,
    canEditSurveyManager,
    canManageTwoFactorDevices,
  }
}

export const useEditUser = ({ userUuid }) => {
  const navigate = useNavigate()
  const user = useUser()

  const [userToUpdateOriginal, setUserToUpdateOriginal] = useState({})
  const [userToUpdate, setUserToUpdate] = useState({})
  const dispatch = useDispatch()

  const { hideSurveyGroup = false } = useQuery()
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)

  const ready = !userUuid || !R.isEmpty(userToUpdate)
  const dirty = !R.equals(userToUpdate, userToUpdateOriginal)
  const editCapabilities = getEditCapabilities({ user, userToUpdate, surveyInfo, ready })
  const editingSameUser = User.isEqual(user)(userToUpdate)

  const { onGetUser, onUpdate, onUpdateProfilePicture, onSave, onRemove, onInviteRepeat } = useActions({
    userToUpdate,
    setUserToUpdate,
    userToUpdateOriginal,
    setUserToUpdateOriginal,
  })

  useEffect(() => {
    if (userUuid) {
      onGetUser()
    }
  }, [userUuid])

  const onSurveyAuthGroupChange = (surveyGroupNew) => {
    const surveyGroupOld = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdate)
    const userUpdated = A.pipe(User.dissocAuthGroup(surveyGroupOld), User.assocAuthGroup(surveyGroupNew))(userToUpdate)
    onUpdate(userUpdated)
  }

  const onSurveyManagerChange = (checked) => {
    const surveyManagerGroup = User.getAuthGroupByName(AuthGroup.groupNames.surveyManager)(user)
    const userUpdated = checked
      ? User.assocAuthGroup(surveyManagerGroup)(userToUpdate)
      : User.dissocAuthGroup(surveyManagerGroup)(userToUpdate)
    onUpdate(userUpdated)
  }

  const onMapApiKeyTest = useCallback(
    async ({ provider, apiKey }) => {
      const success = await API.testMapApiKey({ provider, apiKey })
      if (success) {
        dispatch(NotificationActions.notifyInfo({ key: 'user.mapApiKeys.keyIsCorrect' }))
      } else {
        dispatch(NotificationActions.notifyError({ key: 'user.mapApiKeys.keyIsNotCorrect' }))
      }
    },
    [dispatch]
  )

  const onExtraChange = useCallback(
    (extra) => {
      onUpdate(User.assocExtra(extra)(userToUpdate))
    },
    [onUpdate, userToUpdate]
  )

  const onSurveyExtraPropsChange = useCallback(
    (extraPropsNew) => {
      onUpdate(User.assocAuthGroupExtraProps(extraPropsNew)(userToUpdate))
    },
    [onUpdate, userToUpdate]
  )

  const onNameChange = useCallback((value) => onUpdate(User.assocName(value)(userToUpdate)), [onUpdate, userToUpdate])

  const onPasswordFormFieldChange = useCallback(
    (fieldKey) => (value) => onUpdate(A.assoc(fieldKey)(value)(userToUpdate)),
    [onUpdate, userToUpdate]
  )

  const onChangePasswordClick = useCallback(() => {
    let changePasswordUri = appModuleUri(userModules.userPasswordChange)
    if (!editingSameUser) {
      changePasswordUri += userUuid
    }
    navigate(changePasswordUri)
  }, [editingSameUser, navigate, userUuid])

  const onManage2FADevicesClick = useCallback(() => {
    navigate(appModuleUri(userModules.user2FADevices))
  }, [navigate])

  return {
    hideSurveyGroup,
    ready,
    dirty,
    user,
    userToUpdate,
    ...editCapabilities,
    onChangePasswordClick,
    onExtraChange,
    onInviteRepeat,
    onManage2FADevicesClick,
    onMapApiKeyTest,
    onNameChange,
    onPasswordFormFieldChange,
    onRemove,
    onSave,
    onSurveyAuthGroupChange,
    onSurveyExtraPropsChange,
    onSurveyManagerChange,
    onUpdate,
    onUpdateProfilePicture,
  }
}
