import React, { useEffect } from 'react'
import * as R from 'ramda'

import useI18n from '../../../../commonComponents/useI18n'

import User from '../../../../../common/user/user'
import AuthGroups from '../../../../../common/auth/authGroups'

import UserValidator from '../../../../../common/user/userValidator'
import { useAsyncGetRequest, useAsyncPutRequest, useFormObject, useOnUpdate } from '../../../../commonComponents/hooks'
import Authorizer from '../../../../../common/auth/authorizer'

import { appModuleUri, userModules } from '../../../appModules'

export const useUserViewState = props => {
  const {
    surveyId, userUuidUrlParam, groups: groupsProps,
    showAppLoader, hideAppLoader, showNotificationMessage,
    history,
  } = props

  const i18n = useI18n()

  const {
    object: formObject, objectValid,
    setObjectField, getFieldValidation
  } = useFormObject({
    name: '',
    email: '',
    groupUuid: null,
  }, UserValidator.validateUser, true)

  // init groups
  const surveyGroups = groupsProps.map(g => ({
    uuid: AuthGroups.getUuid(g),
    label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
  }))

  const { data: user = {}, dispatch: fetchUser } = useAsyncGetRequest(
    `/api/survey/${surveyId}/user/${userUuidUrlParam}`,
    {}
  )
  useEffect(fetchUser, [])

  useEffect(() => {
    if (!R.isEmpty(user)) {
      const { name, email, authGroups } = user

      // look for current survey's group in returned user object
      const userGroup = Authorizer.isSystemAdmin(user)
        ? User.getAuthGroups(user)[0]
        : authGroups.find(g => AuthGroups.getSurveyId(g) === surveyId)

      setName(name)
      setEmail(email)
      setGroup(userGroup)
    }
  }, [user])

  const { data: putResponse, error: putError, dispatch: putUser } = useAsyncPutRequest(
    `/api/user/${User.getUuid(user)}`,
    {
      name: formObject.name,
      groupUuid: formObject.groupUuid,
    }
  )

  // server responses update
  useOnUpdate(() => {
    hideAppLoader()
    if (putResponse) {
      history.push(appModuleUri(userModules.users))
      showNotificationMessage('usersView.updateUserConfirmation', { name: formObject.name })
    }
  }, [putResponse, putError])

  const updateUser = () => {
    showAppLoader()
    putUser()
  }

  const setName = name => setObjectField('name', name)

  const setEmail = email => setObjectField('email', email)

  const setGroup = group => {
    const groupUuid = AuthGroups.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  return {
    name: formObject.name,
    email: formObject.email,
    group: surveyGroups.find(R.propEq('uuid', formObject.groupUuid)),
    surveyGroups,
    objectValid,
    getFieldValidation,
    setName,
    setEmail,
    setGroup,
    updateUser
  }
}