import React, { useEffect, useState } from 'react'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import User from '../../../../../common/user/user'
import Survey from '../../../../../common/survey/survey'
import UserValidator from '../../../../../common/user/userValidator'
import AuthGroups from '../../../../../common/auth/authGroups'
import Authorizer from '../../../../../common/auth/authorizer'

import {
  useAsyncGetRequest,
  useAsyncPostRequest,
  useAsyncPutRequest,
  useFormObject,
  useOnUpdate
} from '../../../../commonComponents/hooks'

import { appModuleUri, userModules } from '../../../appModules'

export const useUserViewState = props => {
  const {
    user, surveyInfo, userUuidUrlParam, groups: groupsProps,
    showAppLoader, hideAppLoader, showNotificationMessage,
    history,
  } = props

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const i18n = useI18n()

  const { data: userToUpdate = {}, dispatch: fetchUser, loaded } = useAsyncGetRequest(
    `/api/survey/${surveyId}/user/${userUuidUrlParam}`
  )

  const isInvitation = !userUuidUrlParam
  const isUserAcceptPending = !(isInvitation || User.hasAccepted(userToUpdate))

  // form fields edit permissions
  const [editPermissions, setEditPermissions] = useState({
    userName: isInvitation ? Authorizer.canInviteUsers(user, surveyInfo) : false,
    userGroupAndEmail: isInvitation ? Authorizer.canInviteUsers(user, surveyInfo) : false,
  })

  // local form object
  const {
    object: formObject, objectValid,
    setObjectField, enableValidation, getFieldValidation,
  } = useFormObject(
    { name: '', email: '', groupUuid: null },
    isInvitation || isUserAcceptPending ? UserValidator.validateInvitation : UserValidator.validateUser,
    !isInvitation
  )

  // form object setters
  const setName = name => setObjectField('name', name)
  const setEmail = email => setObjectField('email', email)
  const setGroup = group => {
    const groupUuid = AuthGroups.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  const [surveyGroups, setSurveyGroups] = useState([])

  useEffect(() => {
    // init form groups
    setSurveyGroups(groupsProps.map(g => ({
      uuid: AuthGroups.getUuid(g),
      label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
    })))

    // init user
    if (!isInvitation) {
      fetchUser()
    }
  }, [])

  useEffect(() => {
    if (loaded) {
      const { name, email } = userToUpdate

      // set form object field from server side response
      // Name can be null if user has not accepted the invitation
      setName(isUserAcceptPending ? undefined : name)
      setEmail(email)
      setGroup(Authorizer.getSurveyUserGroup(userToUpdate, surveyInfo))

      // set edit form permissions
      const canEdit = Authorizer.canEditUser(user, surveyInfo, userToUpdate)
      setEditPermissions({
        userName: canEdit && !isUserAcceptPending,
        userGroupAndEmail: isInvitation || Authorizer.canEditUserGroupAndEmail(user, surveyInfo, userToUpdate),
      })

      enableValidation(canEdit)
    }
  }, [loaded])

  // persist user/invitation actions
  const {
    dispatch: saveUser,
    data: userSaveResponse,
    error: userSaveError,
  } = isInvitation
    ? useAsyncPostRequest(`/api/survey/${surveyId}/users/invite`, R.omit(['name'], formObject))
    : useAsyncPutRequest(`/api/survey/${surveyId}/user/${User.getUuid(userToUpdate)}`, formObject)

  useOnUpdate(() => {
    hideAppLoader()
    if (userSaveResponse) {
      history.push(appModuleUri(userModules.users))
      if (isInvitation) {
        showNotificationMessage('usersView.inviteUserConfirmation', { email: formObject.email })
      } else {
        showNotificationMessage('usersView.updateUserConfirmation', { name: formObject.name })
      }
    }
  }, [userSaveResponse, userSaveError])

  const sendRequest = () => {
    showAppLoader()
    saveUser()
  }

  return {
    loaded: isInvitation || loaded,

    isUserAcceptPending,
    isInvitation,

    canEdit: editPermissions.userName || editPermissions.userGroupAndEmail,
    canEditName: editPermissions.userName,
    canEditGroupAndEmail: editPermissions.userGroupAndEmail,

    name: formObject.name,
    email: formObject.email,
    group: surveyGroups.find(R.propEq('uuid', formObject.groupUuid)),
    surveyGroups,
    objectValid,

    getFieldValidation,
    setName,
    setEmail,
    setGroup,
    sendRequest,
  }
}
