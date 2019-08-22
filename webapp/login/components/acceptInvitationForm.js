import React from 'react'
import { connect } from 'react-redux'

import { Input } from '../../commonComponents/form/input'
import useFormObject from '../../commonComponents/hooks/useFormObject'
import Validator from '../../../common/validation/validator'

import { validatePassword, validatePasswordStrength, validatePasswordConfirm, errors } from './passwordValidator'

import { acceptInvitation, setLoginError } from '../actions'

const AcceptInvitationForm = props => {

  const { acceptInvitation, setLoginError } = props

  const formErrors = {
    ...errors,
    userName: {
      requiredField: 'Please enter a new name',
    }
  }

  const validateObj = async obj => await Validator.validate(
    obj,
    {
      'userName': [Validator.validateRequired],
      'passwordConfirm': [validatePasswordConfirm],
      'password': [Validator.validateRequired, validatePassword, validatePasswordStrength],
    })

  const {
    object: formObject,
    setObjectField,
    objectValid,
    getFieldValidation,
  } = useFormObject({
    userName: '',
    password: '',
    passwordConfirm: '',
  }, validateObj, true)

  const userName = formObject.userName
  const password = formObject.password
  const passwordConfirm = formObject.passwordConfirm

  const onClickReset = () => {
    if (objectValid) {
      acceptInvitation(userName, password)
    } else {
      const firstMatch = ['userName', 'passwordConfirm', 'password']
        .map(field => ({ field, validation: getFieldValidation(field) }))
        .find(v => !Validator.isValidationValid(v.validation))
      const key = firstMatch.validation.errors[0].key
      setLoginError(formErrors[firstMatch.field][key])
    }
  }

  const setUserName = userName => setObjectField('userName', userName)
  const setPassword = password => setObjectField('password', password)
  const setPasswordConfirm = passwordConfirm => setObjectField('passwordConfirm', passwordConfirm)

  return (
    <div className="login-form">
      <Input value={userName}
             onChange={setUserName}
             type='text'
             name='name'
             className="login-form__input"
             placeholder='Your Name'/>

      <Input value={password}
             onChange={setPassword}
             type='password'
             name='newPassword'
             className="login-form__input"
             placeholder='Your new Password'/>

      <Input value={passwordConfirm}
             onChange={setPasswordConfirm}
             type='password'
             name='newPasswordRepeat'
             className="login-form__input"
             placeholder='Repeat your new Password'/>

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                onClick={onClickReset}>
          Reset password
        </button>
      </div>
    </div>
  )
}

export default connect(null, { acceptInvitation, setLoginError })(AcceptInvitationForm)
