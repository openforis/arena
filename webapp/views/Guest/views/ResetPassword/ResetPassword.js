import './ResetPassword.scss'
import React from 'react'

import * as User from '@core/user/user'

import { useI18n } from '@webapp/store/system'
import Error from '@webapp/views/Guest/Error'

import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'

import { useResetPassword } from './store/hooks'
import { Button } from '@webapp/components'
import { PasswordInput, TextInput } from '@webapp/components/form'

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

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      <TextInput label={i18n.t('loginView.yourEmail')} value={user.email} readOnly type="text" name="email" />

      {!User.hasAccepted(initialUser) && (
        <>
          <DropdownUserTitle user={user} onChange={onChangeUserTitle} />
          <TextInput
            autoComplete={false}
            defaultValue={user.name}
            name="fullname"
            label={i18n.t('loginView.yourName')}
            onChange={(value) => onChangeUser({ prop: 'name', value })}
          />
        </>
      )}
      <PasswordInput
        defaultValue={user.password}
        label={i18n.t('loginView.yourNewPassword')}
        onChange={(value) => onChangeUser({ prop: 'password', value })}
      />

      <PasswordInput
        defaultValue={user.passwordConfirm}
        label={i18n.t('loginView.repeatYourNewPassword')}
        onChange={(value) => onChangeUser({ prop: 'passwordConfirm', value })}
      />

      <div className="guest__buttons">
        <button type="submit" className="btn" onClick={onSubmit}>
          {i18n.t('resetPasswordView.setNewPassword')}
        </button>
      </div>

      <Error error={error} />
    </form>
  )
}

export default ResetPassword
