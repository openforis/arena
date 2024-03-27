import './ResetPassword.scss'

import React from 'react'

import * as User from '@core/user/user'

import { Button } from '@webapp/components'
import { PasswordInput, PasswordStrengthChecker, TextInput } from '@webapp/components/form'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import { useI18n } from '@webapp/store/system'
import Error from '@webapp/views/Guest/Error'

import { useResetPassword } from './store/hooks'

const ResetPassword = () => {
  const i18n = useI18n()

  const {
    state: { initialUser, user, error },
    onChangeUser,
    onChangeUserTitle,
    onSubmit,
    navigateToHomePage,
  } = useResetPassword()

  if (!user || !user.email)
    return (
      <form onSubmit={(event) => event.preventDefault()} className="guest__form">
        <Button className="btn-goto-home" label="common.goToHomePage" onClick={navigateToHomePage} />
      </form>
    )

  const hasAlreadyAccepted = User.hasAccepted(initialUser)

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form reset-password">
      <div className="title">
        {i18n.t(
          hasAlreadyAccepted
            ? 'resetPasswordView.title.setYourNewPassword'
            : 'resetPasswordView.title.completeRegistration'
        )}
      </div>

      <TextInput label={i18n.t('loginView.yourEmail')} value={user.email} readOnly type="text" name="email" />

      {!hasAlreadyAccepted && (
        <>
          <DropdownUserTitle user={user} onChange={onChangeUserTitle} />
          <TextInput
            defaultValue={user.name}
            name="name"
            autoComplete="new-name"
            label={i18n.t('loginView.yourName')}
            onChange={(value) => onChangeUser({ prop: 'name', value })}
          />
        </>
      )}
      <PasswordInput
        autoComplete="new-password"
        defaultValue={user.password}
        label={i18n.t(hasAlreadyAccepted ? 'loginView.yourNewPassword' : 'loginView.yourPassword')}
        onChange={(value) => onChangeUser({ prop: 'password', value })}
      />

      <PasswordStrengthChecker password={user.password} />

      <PasswordInput
        autoComplete="new-password"
        defaultValue={user.passwordConfirm}
        label={i18n.t(hasAlreadyAccepted ? 'loginView.repeatYourNewPassword' : 'loginView.repeatYourPassword')}
        onChange={(value) => onChangeUser({ prop: 'passwordConfirm', value })}
      />

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          {i18n.t(hasAlreadyAccepted ? 'resetPasswordView.setNewPassword' : 'resetPasswordView.completeRegistration')}
        </button>
      </div>

      <Error error={error} />
    </form>
  )
}

export default ResetPassword
