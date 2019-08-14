import React, { useEffect, useState } from 'react'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import User from '../../../../../common/user/user'
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
    surveyId, userUuidUrlParam, groups: groupsProps,
    showAppLoader, hideAppLoader, showNotificationMessage,
    history,
  } = props

  const i18n = useI18n()

  const newUser = !userUuidUrlParam

  // init groups
  const surveyGroups = groupsProps.map(g => ({
    uuid: AuthGroups.getUuid(g),
    label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
  }))

  const validationFn = newUser ? UserValidator.validateNewUser : UserValidator.validateUser

  const {
    object: formObject, objectValid,
    setObjectField, enableValidation, getFieldValidation,
  } = useFormObject({ name: '', email: '', groupUuid: null }, validationFn, true)

  const [loaded, setLoaded] = useState(newUser)

  const setName = name => setObjectField('name', name)

  const setEmail = email => setObjectField('email', email)

  const setGroup = group => {
    const groupUuid = AuthGroups.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  // ====== User fetching - user in user edit mode

  const { data: userToUpdate = {}, dispatch: fetchUser } = useAsyncGetRequest(
    `/api/survey/${surveyId}/user/${userUuidUrlParam}`,
    {}
  )
  useEffect(() => {
    if (!newUser) {
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

      setName(name)
      setEmail(email)
      setGroup(userGroup)

      setLoaded(true)
    }
  }, [userToUpdate])

  const { data: saveResponse, error: saveError, dispatch: saveUser } = newUser
    ? useAsyncPostRequest(`/api/survey/${surveyId}/users/invite`, formObject)
    : useAsyncPutRequest(`/api/user/${User.getUuid(userToUpdate)}`, R.omit(['email'], formObject))

  // server responses update
  useOnUpdate(() => {
    hideAppLoader()
    if (saveResponse) {
      history.push(appModuleUri(userModules.users))
      if (newUser) {
        showNotificationMessage('usersView.inviteUserConfirmation', { email: formObject.email })
      } else {
        showNotificationMessage('usersView.updateUserConfirmation', { name: formObject.name })
      }
    }
  }, [saveResponse, saveError])

  const sendRequest = () => {
    if (objectValid) {
      showAppLoader()
      saveUser()
    } else {
      enableValidation()
    }
  }

  return {
    newUser,

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