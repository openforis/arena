import React from 'react'
import { connect } from 'react-redux'

import useI18n from '../../commonComponents/useI18n'

import { acceptInvitation, setLoginError } from '../actions'
import { useAcceptInvitationFormState } from './useAcceptInvitationFormState'

const AcceptInvitationForm = props => {

  const i18n = useI18n()

  const {
    userName, password, passwordConfirm,
    setUserName, setPassword, setPasswordConfirm,
    onClickReset,
  } = useAcceptInvitationFormState(props)


  return (
    <div className="login-form">
      <input value={userName}
             onChange={e => setUserName(e.target.value)}
             type='text'
             name='name'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourName')}/>

      <input value={password}
             onChange={e => setPassword(e.target.value)}
             type='password'
             name='newPassword'
             className="login-form__input"
             placeholder={i18n.t('loginView.yourNewPassword')}/>

      <input value={passwordConfirm}
             onChange={e => setPasswordConfirm(e.target.value)}
             type='password'
             name='newPasswordRepeat'
             className="login-form__input"
             placeholder={i18n.t('loginView.repeatYourNewPassword')} />

      <div className="login-form__buttons">
        <button type="button"
                className="btn btn-login"
                onClick={onClickReset}>
          {i18n.t('loginView.resetPassword')}
        </button>
      </div>
    </div>
  )
}

export default connect(null, {
  acceptInvitation,
  setLoginError
})(AcceptInvitationForm)
