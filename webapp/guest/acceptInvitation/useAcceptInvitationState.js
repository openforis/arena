import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { useFormObject } from '@webapp/commonComponents/hooks'

import { validateResetPasswordObj, getFirstError } from '@webapp/guest/login/loginValidator'
import { acceptInvitation, setLoginError } from '@webapp/guest/login/actions'

export const useAcceptInvitationState = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const { object: formObject, setObjectField, objectValid, validation } = useFormObject(
    { name: '', password: '', passwordConfirm: '' },
    validateResetPasswordObj,
    true,
  )

  const name = formObject.name
  const password = formObject.password
  const passwordConfirm = formObject.passwordConfirm

  const onSubmit = () => {
    if (objectValid) {
      dispatch(acceptInvitation(name, password, history))
    } else {
      dispatch(setLoginError(getFirstError(validation, ['name', 'password', 'passwordConfirm'])))
    }
  }

  return {
    name,
    setName: name => setObjectField('name', name),
    password,
    setPassword: password => setObjectField('password', password),
    passwordConfirm,
    setPasswordConfirm: password => setObjectField('passwordConfirm', password),
    onSubmit,
  }
}
