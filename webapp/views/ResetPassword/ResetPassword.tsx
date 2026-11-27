import classNames from 'classnames'
import { useParams, useSearchParams } from 'react-router'

import * as User from '@core/user/user'
import { Button } from '@webapp/components'
import { PasswordInput, PasswordStrengthChecker, TextInput } from '@webapp/components/form'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import { ExternalLoginButtons } from '@webapp/components/guest/ExternalLoginButtons'
import GuestError from '@webapp/components/guest/GuestError'
import { GuestViewHeader } from '@webapp/components/guest/GuestViewHeader'
import { LoginActions } from '@webapp/store/login'
import { useI18n } from '@webapp/store/system'

import { RegistrationFields } from './RegistrationFields'
import { useResetPassword } from './store/hooks'

const ResetPassword = () => {
  const i18n = useI18n()
  const { uuid: invitationUuid } = useParams()
  // error of an invitation accepted with an external login provider
  const [searchParams] = useSearchParams()
  const externalLoginErrorKey = searchParams.get('externalLoginError')

  const {
    onBeforeExternalLogin,
    registrationInfo,
    state: { initialUser, user, error },
    onChangeUser,
    onChangeUserTitle,
    onSubmit,
    navigateToHomePage,
  } = useResetPassword()

  if (!user?.email)
    return (
      <form onSubmit={(event) => event.preventDefault()} className="guest__form">
        <Button className="guest__submit" label="common.goToHomePage" onClick={navigateToHomePage} />
      </form>
    )

  const hasAlreadyAccepted = User.hasAccepted(initialUser)
  const viewKey = hasAlreadyAccepted ? 'setYourNewPassword' : 'completeRegistration'

  const emailInput = (
    <TextInput label={i18n.t('guest:loginView.yourEmail')} value={user.email} readOnly type="text" name="email" />
  )
  const passwordInput = (
    <PasswordInput
      autoComplete="new-password"
      defaultValue={user.password}
      label={i18n.t(hasAlreadyAccepted ? 'guest:loginView.yourNewPassword' : 'guest:loginView.yourPassword')}
      onChange={(value) => onChangeUser({ prop: 'password', value })}
    />
  )
  const passwordConfirmInput = (
    <PasswordInput
      autoComplete="new-password"
      defaultValue={user.passwordConfirm}
      label={i18n.t(
        hasAlreadyAccepted ? 'guest:loginView.repeatYourNewPassword' : 'guest:loginView.repeatYourPassword'
      )}
      onChange={(value) => onChangeUser({ prop: 'passwordConfirm', value })}
    />
  )

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className={classNames('guest__form', { 'guest__form--registration': !hasAlreadyAccepted })}
    >
      <GuestViewHeader
        // the registration form has no description, to save vertical space
        description={hasAlreadyAccepted ? `guest:resetPasswordView.description.${viewKey}` : undefined}
        // no icon in the registration form, to save vertical space
        icon={hasAlreadyAccepted ? 'key' : undefined}
        title={`guest:resetPasswordView.title.${viewKey}`}
      />
      <GuestError error={error} />
      {externalLoginErrorKey && (
        <GuestError error={LoginActions.toExternalLoginErrorMessageKey(externalLoginErrorKey)} />
      )}

      {hasAlreadyAccepted ? (
        <>
          {emailInput}
          {passwordInput}
          <PasswordStrengthChecker password={user.password} />
          {passwordConfirmInput}
        </>
      ) : (
        // two fields per row (one on small screens), to avoid scrolling
        <>
          <div className="guest__form-row">
            {emailInput}
            <DropdownUserTitle
              disabled={Boolean(registrationInfo?.title)}
              label="user.title"
              user={user}
              onChange={onChangeUserTitle}
            />
          </div>
          <RegistrationFields onChangeUser={onChangeUser} readOnly={Boolean(registrationInfo)} user={user} />
          <div className="guest__form-row">
            {passwordInput}
            {passwordConfirmInput}
          </div>
          <PasswordStrengthChecker password={user.password} />
        </>
      )}

      <Button
        className="guest__submit"
        label={
          hasAlreadyAccepted ? 'guest:resetPasswordView.setNewPassword' : 'guest:resetPasswordView.completeRegistration'
        }
        onClick={onSubmit}
        type="submit"
      />
      {!hasAlreadyAccepted && (
        // accept the invitation with an external provider instead of a password
        <ExternalLoginButtons
          labelKey="guest:externalLogin.continueWith"
          onBeforeNavigate={onBeforeExternalLogin}
          query={{ invitation: invitationUuid, name: [user.firstName, user.lastName].filter(Boolean).join(' ') }}
        />
      )}
    </form>
  )
}

export default ResetPassword
