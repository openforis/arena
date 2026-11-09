import * as User from '@core/user/user'

import { useI18n } from '@webapp/store/system'
import Error from '@webapp/views/Guest/Error'
import { GuestViewHeader } from '@webapp/views/Guest/components/GuestViewHeader'

import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'

import { useResetPassword } from './store/hooks'
import { Button } from '@webapp/components'
import { PasswordInput, PasswordStrengthChecker, TextInput } from '@webapp/components/form'

const ResetPassword = () => {
  const i18n = useI18n()

  const {
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
        icon={hasAlreadyAccepted ? 'icon-key' : 'icon-user-plus'}
        title={`guest:resetPasswordView.title.${viewKey}`}
      />
      <Error error={error} />

      <TextInput label={i18n.t('guest:loginView.yourEmail')} value={user.email} readOnly type="text" name="email" />

      {!hasAlreadyAccepted && (
        <>
          <DropdownUserTitle user={user} onChange={onChangeUserTitle} />
          <TextInput
            defaultValue={user.name}
            name="name"
            autoComplete="new-name"
            label={i18n.t('guest:loginView.yourName')}
            onChange={(value) => onChangeUser({ prop: 'name', value })}
          />
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
    </form>
  )
}

export default ResetPassword
