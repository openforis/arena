import React from 'react'

import { Countries } from '@core/countries'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import DropdownUserTitle from '@webapp/components/form/DropdownUserTitle'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
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

// width of the title column: enough for the longest title label in the current language (plus clear and arrow icons)
const useTitleColumnWidth = (): string => {
  const i18n = useI18n()
  const maxLength = Math.max(
    i18n.t('user.title').length,
    ...User.titleKeysArray.map((key) => i18n.t(`user.titleValues.${key}`).length)
  )
  // 1.2: the app font has letter spacing, wider than the `ch` unit
  return `calc(${Math.ceil(maxLength * 1.2)}ch + 5rem)`
}

// institution and country given when registering (not editable)
const RegistrationInfoFields = ({ user }: { user: any }) => {
  const institution = User.getInstitution(user)
  const countryCode = User.getCountry(user)
  return (
    <>
      {institution && (
        <FormItem className="user-edit-fields__wide" label="guest:accessRequestView.fields.props.institution">
          <Input disabled value={institution} />
        </FormItem>
      )}
      {countryCode && (
        <FormItem className="user-edit-fields__wide" label="guest:accessRequestView.fields.props.country">
          <Input disabled value={Countries.getCountryName({ code: countryCode }) ?? countryCode} />
        </FormItem>
      )}
    </>
  )
}

/**
 * Title, name, email, registration info and extra properties of the user.
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

  const titleColumnWidth = useTitleColumnWidth()

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
      <div
        className="user-edit-fields user-edit-fields--personal"
        style={{ '--title-column-width': titleColumnWidth } as React.CSSProperties}
      >
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
        {canViewEmail && <RegistrationInfoFields user={userToUpdate} />}
      </div>
      <UserExtraPropsEditor onChange={onExtraChange} readOnly={!canEdit} user={userToUpdate} />
    </UserEditSection>
  )
}
