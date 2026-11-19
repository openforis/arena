import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import { FormItem, Input } from '@webapp/components/form/Input'

import { UserEditSection } from '../UserEditSection'
import { UserExtraPropsEditor } from '../UserExtraPropsEditor'

type Props = {
  canEdit: boolean
  canEditEmail: boolean
  canEditName: boolean
  canViewEmail: boolean
  editingLoggedInUser: boolean
  onExtraChange: (extra: Record<string, unknown>) => void
  onNameChange: (value: string) => void
  onUpdate: (user: any) => void
  userToUpdate: any
  validation: any
}

/**
 * Title, name, email and extra properties of the user.
 */
export const PersonalInfoSection = (props: Props) => {
  const {
    canEdit,
    canEditEmail,
    canEditName,
    canViewEmail,
    editingLoggedInUser,
    onExtraChange,
    onNameChange,
    onUpdate,
    userToUpdate,
    validation,
  } = props

  return (
    <UserEditSection
      description={
        editingLoggedInUser
          ? 'usersView:profile.sections.personalDescriptionOwn'
          : 'usersView:profile.sections.personalDescription'
      }
      id="user-edit-personal"
      title="usersView:profile.sections.personal"
    >
      <div className="user-edit-fields">
        <FormItem label="user.title">
          <DropdownUserTitle
            disabled={!canEdit}
            onChange={onUpdate}
            user={userToUpdate}
            validation={Validation.getFieldValidation(User.keysProps.title)(validation)}
          />
        </FormItem>
        <FormItem label={canEditName ? 'common.name' : 'usersView:notAcceptedYet'}>
          <Input
            disabled={!canEditName}
            maxLength={User.nameMaxLength}
            onChange={onNameChange}
            validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : undefined}
            value={User.getName(userToUpdate)}
          />
        </FormItem>
        {canViewEmail && (
          <FormItem className="user-edit-fields__wide" label="common.email">
            <Input
              disabled={!canEditEmail}
              onChange={(value) => onUpdate(User.assocEmail(value)(userToUpdate))}
              validation={Validation.getFieldValidation(User.keys.email)(validation)}
              value={User.getEmail(userToUpdate)}
            />
          </FormItem>
        )}
      </div>
      <UserExtraPropsEditor onChange={onExtraChange} readOnly={!canEdit} user={userToUpdate} />
    </UserEditSection>
  )
}
