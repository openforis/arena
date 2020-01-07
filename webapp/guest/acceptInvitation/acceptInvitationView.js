import React from 'react'
import { connect, useSelector } from 'react-redux'

import { useI18n } from '@webapp/commonComponents/hooks'

import { acceptInvitation, setLoginError } from '@webapp/guest/login/actions'
import { useAcceptInvitationState } from './useAcceptInvitationState'
import NotLoggedInView from '@webapp/guest/components/notLoggedInView'

import * as LoginState from '@webapp/guest/login/loginState'

const AcceptInvitationView = props => {
  const i18n = useI18n()
  const error = useSelector(LoginState.getError)

  const {
    name,
    password,
    passwordConfirm,
    setName,
    setPassword,
    setPasswordConfirm,
    onSubmit,
  } = useAcceptInvitationState(props)

  return (
    <NotLoggedInView error={error}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        type="text"
        placeholder={i18n.t('loginView.yourName')}
      />

      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder={i18n.t('loginView.yourNewPassword')}
      />

      <input
        value={passwordConfirm}
        onChange={e => setPasswordConfirm(e.target.value)}
        type="password"
        placeholder={i18n.t('loginView.repeatYourNewPassword')}
      />

      <div className="not-logged-in__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          {i18n.t('loginView.resetPassword')}
        </button>
      </div>
    </NotLoggedInView>
  )
}

export default connect(null, {
  acceptInvitation,
  setLoginError,
})(AcceptInvitationView)
