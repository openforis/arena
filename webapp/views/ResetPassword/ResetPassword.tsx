import { useState } from 'react'
import classNames from 'classnames'
import { useParams, useSearchParams } from 'react-router'

import * as User from '@core/user/user'
import { Button } from '@webapp/components'
import { PasswordInput, PasswordStrengthChecker, TextInput } from '@webapp/components/form'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import Radiobox from '@webapp/components/form/Radiobox'
import { ExternalLoginButton, useLoginProviders } from '@webapp/components/guest/ExternalLoginButtons'
import GuestError from '@webapp/components/guest/GuestError'
import { GuestViewHeader } from '@webapp/components/guest/GuestViewHeader'
import { LoginActions } from '@webapp/store/login'
import { useI18n } from '@webapp/store/system'

import { RegistrationFields } from './RegistrationFields'
import { useResetPassword } from './store/hooks'

const passwordCompletionMethod = 'password'

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

  const providers = useLoginProviders()
  // how the registration is completed: password or id of an external login provider
  const [completionMethod, setCompletionMethod] = useState(passwordCompletionMethod)

  if (!user?.email)
    return (
      <form onSubmit={(event) => event.preventDefault()} className="guest__form">
        <Button className="guest__submit" label="common.goToHomePage" onClick={navigateToHomePage} />
      </form>
    )

  const hasAlreadyAccepted = User.hasAccepted(initialUser)
  const viewKey = hasAlreadyAccepted ? 'setYourNewPassword' : 'completeRegistration'

  const emailInput = (
    <TextInput
      label={i18n.t(hasAlreadyAccepted ? 'guest:loginView.yourEmail' : 'guest:loginView.email')}
      value={user.email}
      readOnly
      type="text"
      name="email"
    />
  )
  const passwordInput = (
    <PasswordInput
      autoComplete="new-password"
      defaultValue={user.password}
      label={i18n.t(hasAlreadyAccepted ? 'guest:loginView.yourNewPassword' : 'guest:loginView.password')}
      onChange={(value) => onChangeUser({ prop: 'password', value })}
    />
  )
  const passwordConfirmInput = (
    <PasswordInput
      autoComplete="new-password"
      defaultValue={user.passwordConfirm}
      label={i18n.t(hasAlreadyAccepted ? 'guest:loginView.repeatYourNewPassword' : 'guest:loginView.repeatPassword')}
      onChange={(value) => onChangeUser({ prop: 'passwordConfirm', value })}
    />
  )

  const submitButton = (
    <Button
      className="guest__submit"
      label={
        hasAlreadyAccepted ? 'guest:resetPasswordView.setNewPassword' : 'guest:resetPasswordView.completeRegistration'
      }
      onClick={onSubmit}
      type="submit"
    />
  )
  const selectedProvider = providers.find((provider) => provider.id === completionMethod)

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
          {submitButton}
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
          {providers.length > 0 && (
            // the choice is shown only when there are external login providers
            <div className="guest__completion-methods" role="radiogroup">
              <Radiobox
                checked={completionMethod === passwordCompletionMethod}
                label="guest:resetPasswordView.definePassword"
                onChange={() => setCompletionMethod(passwordCompletionMethod)}
              />
              {providers.map((provider) => (
                <Radiobox
                  key={provider.id}
                  checked={completionMethod === provider.id}
                  label={i18n.t('guest:externalLogin.continueWith', { provider: provider.label })}
                  onChange={() => setCompletionMethod(provider.id)}
                />
              ))}
            </div>
          )}
          {selectedProvider ? (
            // accept the invitation with the external provider instead of a password
            <ExternalLoginButton
              className="guest__submit-external"
              labelKey="guest:resetPasswordView.completeRegistrationWith"
              onBeforeNavigate={onBeforeExternalLogin}
              provider={selectedProvider}
              query={{ invitation: invitationUuid, name: [user.firstName, user.lastName].filter(Boolean).join(' ') }}
            />
          ) : (
            <>
              <div className="guest__form-row">
                {passwordInput}
                {passwordConfirmInput}
              </div>
              <PasswordStrengthChecker password={user.password} />
              {submitButton}
            </>
          )}
        </>
      )}
    </form>
  )
}

export default ResetPassword
