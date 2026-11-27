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

  return (
    <form onSubmit={(event) => event.preventDefault()} className="guest__form">
      <GuestViewHeader
        description={`guest:resetPasswordView.description.${viewKey}`}
        icon={hasAlreadyAccepted ? 'key' : 'userAdd'}
        title={`guest:resetPasswordView.title.${viewKey}`}
      />
      <GuestError error={error} />
      {externalLoginErrorKey && (
        <GuestError error={LoginActions.toExternalLoginErrorMessageKey(externalLoginErrorKey)} />
      )}

      <TextInput label={i18n.t('guest:loginView.yourEmail')} value={user.email} readOnly type="text" name="email" />

      {!hasAlreadyAccepted && (
        <>
          <DropdownUserTitle user={user} onChange={onChangeUserTitle} />
          <RegistrationFields onChangeUser={onChangeUser} readOnly={Boolean(registrationInfo)} user={user} />
        </>
      )}
      <PasswordInput
        autoComplete="new-password"
        defaultValue={user.password}
        label={i18n.t(hasAlreadyAccepted ? 'guest:loginView.yourNewPassword' : 'guest:loginView.yourPassword')}
        onChange={(value) => onChangeUser({ prop: 'password', value })}
      />

      <PasswordStrengthChecker password={user.password} />

      <PasswordInput
        autoComplete="new-password"
        defaultValue={user.passwordConfirm}
        label={i18n.t(
          hasAlreadyAccepted ? 'guest:loginView.repeatYourNewPassword' : 'guest:loginView.repeatYourPassword'
        )}
        onChange={(value) => onChangeUser({ prop: 'passwordConfirm', value })}
      />

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
          query={{ invitation: invitationUuid, name: [user.firstName, user.lastName].filter(Boolean).join(' ') }}
        />
      )}
    </form>
  )
}

export default ResetPassword
