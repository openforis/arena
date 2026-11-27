import { Button } from '@webapp/components'
import { AppIcon } from '@webapp/components/AppIcon'
import { UserPasswordSetForm } from '../../UserPasswordChange/UserPasswordSetForm'
import { SignInMethodsPanel } from '../SignInMethodsPanel'
import { UserEditSection, UserEditSectionRow } from '../UserEditSection'

export type SignInSecuritySectionVisibility = {
  // new user: the password is set in the form
  passwordForm: boolean
  signInMethods: boolean
  // password change: in the sign-in methods when shown, otherwise in its own row
  changePassword: boolean
  twoFactorDevices: boolean
}

type Props = {
  editingLoggedInUser: boolean
  loggedInUserSystemAdmin: boolean
  onChangePasswordClick: () => void
  onManage2FADevicesClick: () => void
  onPasswordFormFieldChange: (fieldKey: string) => (value: string) => void
  userUuid?: string
  userToUpdate: any
  validation: any
  visibility: SignInSecuritySectionVisibility
}

const PasswordIcon = () => <AppIcon className="user-edit-section__row-icon" name="key" size={20} />

/**
 * Password, linked external login providers and two-factor authentication.
 */
export const SignInSecuritySection = (props: Props) => {
  const {
    editingLoggedInUser,
    loggedInUserSystemAdmin,
    onChangePasswordClick,
    onManage2FADevicesClick,
    onPasswordFormFieldChange,
    userUuid,
    userToUpdate,
    validation,
    visibility,
  } = props

  const changePasswordRowVisible = visibility.changePassword && !visibility.signInMethods

  return (
    <UserEditSection
      description={
        editingLoggedInUser
          ? 'usersView:profile.sections.securityDescriptionOwn'
          : 'usersView:profile.sections.securityDescription'
      }
      id="user-edit-security"
      title="usersView:profile.sections.security"
    >
      {visibility.passwordForm && (
        <div className="user-edit-password-form">
          <UserPasswordSetForm form={userToUpdate} onFieldChange={onPasswordFormFieldChange} validation={validation} />
        </div>
      )}
      {visibility.signInMethods && (
        <SignInMethodsPanel
          editingLoggedInUser={editingLoggedInUser}
          onChangePasswordClick={visibility.changePassword ? onChangePasswordClick : undefined}
          onSetPasswordClick={onChangePasswordClick}
          systemAdmin={loggedInUserSystemAdmin}
          userUuid={userUuid}
        />
      )}
      {(changePasswordRowVisible || visibility.twoFactorDevices) && (
        <div className="user-edit-section__rows">
          {changePasswordRowVisible && (
            <UserEditSectionRow icon={<PasswordIcon />} title="usersView:signInMethods.password">
              <Button
                className="btn-s"
                label="userPasswordChangeView.changePassword"
                onClick={onChangePasswordClick}
                variant="outlined"
              />
            </UserEditSectionRow>
          )}
          {visibility.twoFactorDevices && (
            <UserEditSectionRow
              description="usersView:profile.twoFactorDescription"
              icon={<AppIcon className="user-edit-section__row-icon" name="shield" size={20} />}
              title="userView.manageTwoFactorDevices.title"
            >
              <Button
                className="btn-s"
                label="userView.manageTwoFactorDevices.label"
                onClick={onManage2FADevicesClick}
                variant="outlined"
              />
            </UserEditSectionRow>
          )}
        </div>
      )}
    </UserEditSection>
  )
}
