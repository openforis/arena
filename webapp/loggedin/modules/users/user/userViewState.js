import React, { useEffect, useState } from 'react'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import User from '../../../../../common/user/user'
import Survey from '../../../../../common/survey/survey'
import AuthGroups from '../../../../../common/auth/authGroups'

import UserValidator from '../../../../../common/user/userValidator'
import {
  useAsyncGetRequest,
  useAsyncPostRequest,
  useAsyncPutRequest,
  useFormObject,
  useOnUpdate
} from '../../../../commonComponents/hooks'

import Authorizer from '../../../../../common/auth/authorizer'

import { appModuleUri, userModules } from '../../../appModules'

export const useUserViewState = props => {
  const {
    user, survey, userUuidUrlParam, groups: groupsProps,
    showAppLoader, hideAppLoader, showNotificationMessage,
    history,
  } = props

  const i18n = useI18n()

  const isNewUser = !userUuidUrlParam

  const surveyId = Survey.getId(survey)

  const { data: userToUpdate = {}, dispatch: fetchUser } = useAsyncGetRequest(
    `/api/survey/${surveyId}/user/${userUuidUrlParam}`,
    {}
  )

  const [canEdit, setCanEdit] = useState(false)
  const [loaded, setLoaded] = useState(isNewUser)

  const canEditName = canEdit && !!User.getName(userToUpdate)
  const validationFn = isNewUser ? UserValidator.validateNewUser : UserValidator.validateUser(canEditName)

  const {
    object: formObject, objectValid,
    setObjectField, setValidationEnabled, getFieldValidation,
  } = useFormObject({ name: '', email: '', groupUuid: null }, validationFn, false)

  const [surveyGroups, setSurveyGroups] = useState([])

  // init groups
  useEffect(() => {
    setSurveyGroups(groupsProps.map(g => ({
      uuid: AuthGroups.getUuid(g),
      label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
    })))
  }, [])

  const setName = name => setObjectField('name', name)

  const setEmail = email => setObjectField('email', email)

  const setGroup = group => {
    const groupUuid = AuthGroups.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  useEffect(() => {
    if (!isNewUser) {
      fetchUser()
    }
  }, [])

  useEffect(() => {
    if (!R.isEmpty(userToUpdate)) {
      const { name, email, authGroups } = userToUpdate

      // look for current survey's group in returned user object
      const userGroup = Authorizer.isSystemAdmin(userToUpdate)
        ? User.getAuthGroups(userToUpdate)[0]
        : authGroups.find(g => AuthGroups.getSurveyId(g) === surveyId)

      setName(name || '') // Name can be null if user has not accepted the invitation
      setEmail(email)
      setGroup(userGroup)

      const canEdit = Authorizer.canEditUser(user, userToUpdate)
      setCanEdit(canEdit)
      setValidationEnabled(canEdit)

      setLoaded(true)
    }
  }, [userToUpdate])

  const { data: userSaveResponse, error: userSaveError, dispatch: saveUser } = isNewUser
    ? useAsyncPostRequest(`/api/survey/${surveyId}/users/invite`, formObject)
    : useAsyncPutRequest(`/api/user/${User.getUuid(userToUpdate)}`, R.omit(['email'], formObject))

  // server responses update
  useOnUpdate(() => {
    hideAppLoader()
    if (userSaveResponse) {
      history.push(appModuleUri(userModules.users))
      if (isNewUser) {
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
    isNewUser,
    canEdit,
    canEditGroup: Authorizer.canEditUserGroup(user, { userToUpdate, survey }),
    // If user hasn't accepted yet (name is null) don't allow to set the name
    canEditName,
    loaded,
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
