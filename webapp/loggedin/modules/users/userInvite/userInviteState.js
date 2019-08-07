import React, { useState, useEffect } from 'react'
import * as R from 'ramda'

import AuthGroups from '../../../../../common/auth/authGroups'
import UserValidator from '../../../../../common/user/userValidator'

import useI18n from '../../../../commonComponents/useI18n'
import { useAsyncPostRequest, useFormObject, useOnUpdate } from '../../../../commonComponents/hooks'

import { appModuleUri, userModules } from '../../../appModules'

export const useUserInviteState = props => {

  const {
    surveyId, groups: groupsProps, history,
    showAppLoader, hideAppLoader
  } = props

  const i18n = useI18n()

  const [groups, setGroups] = useState([])

  const {
    object, objectValid,
    setObjectField, enableValidation, getFieldValidation
  } = useFormObject({ email: '', groupId: null }, UserValidator.validateNewUser)

  const { data, error, dispatch } = useAsyncPostRequest(
    `/api/survey/${surveyId}/users/invite`,
    { ...object }
  )

  // init groups
  useEffect(() => {
    const groups = groupsProps.map(g => ({
      id: AuthGroups.getId(g),
      label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
    }))

    setGroups(groups)
  }, [])

  // server responses update
  useOnUpdate(() => {
    hideAppLoader()
    if (data) {
      history.push(appModuleUri(userModules.users))
    }
  }, [data, error])

  // ==== form functions

  const setEmail = email => {
    setObjectField('email', email)
  }

  const setGroup = group => {
    const groupId = AuthGroups.getId(group)
    setObjectField('groupId', groupId)
  }

  const inviteUser = () => {
    if (objectValid) {
      showAppLoader()
      dispatch()
    } else {
      enableValidation()
    }
  }

  return {
    email: object.email,
    group: groups.find(R.propEq('id', object.groupId)),
    groups,

    setEmail,
    setGroup,
    getFieldValidation,
    inviteUser,
  }

}