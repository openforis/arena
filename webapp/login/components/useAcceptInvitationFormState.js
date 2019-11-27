import React from 'react'

import { useFormObject } from '@webapp/commonComponents/hooks'

import { validateAcceptInvitationObj, getFirstError } from './loginValidator'

export const useAcceptInvitationFormState = props => {
  const { acceptInvitation, setLoginError } = props

  const {
    object: formObject,
    setObjectField,
    objectValid,
    validation,
  } = useFormObject(
    {
      userName: '',
      password: '',
      passwordConfirm: '',
    },
    validateAcceptInvitationObj,
    true,
  )

  const userName = formObject.userName
  const password = formObject.password
  const passwordConfirm = formObject.passwordConfirm

  const onClickReset = () => {
    if (objectValid) {
      acceptInvitation(userName, password)
    } else {
      setLoginError(
        getFirstError(validation, ['userName', 'password', 'passwordConfirm']),
      )
    }
  }

  return {
    userName,
    setUserName: userName => setObjectField('userName', userName),
    password,
    setPassword: password => setObjectField('password', password),
    passwordConfirm,
    setPasswordConfirm: password => setObjectField('passwordConfirm', password),
    onClickReset,
  }
}
