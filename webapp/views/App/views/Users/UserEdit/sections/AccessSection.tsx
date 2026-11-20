import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { Switch } from '@webapp/components'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import DropdownUserRole from '../../DropdownUserRole'
import { UserEditSection, UserEditSectionRow } from '../UserEditSection'

export type AccessSectionVisibility = {
  roleInSurvey: boolean
  systemAdmin: boolean
  surveyManager: boolean
  maxSurveys: boolean
}

type Props = {
  canEdit: boolean
  canEditGroup: boolean
  canEditSurveyManager: boolean
  canEditSystemAdmin: boolean
  editingLoggedInUser: boolean
  groupInCurrentSurvey: any
  onSurveyAuthGroupChange: (group: any) => void
  onSurveyManagerChange: (value: boolean) => void
  onUpdate: (user: any) => void
  systemAdminGroup: any
  userToUpdate: any
  validation: any
  visibility: AccessSectionVisibility
}

/**
 * Role in the current survey and Arena-wide permissions (system administrator, survey manager).
 */
export const AccessSection = (props: Props) => {
  const {
    canEdit,
    canEditGroup,
    canEditSurveyManager,
    canEditSystemAdmin,
    editingLoggedInUser,
    groupInCurrentSurvey,
    onSurveyAuthGroupChange,
    onSurveyManagerChange,
    onUpdate,
    systemAdminGroup,
    userToUpdate,
    validation,
    visibility,
  } = props

  const systemAdmin = User.isSystemAdmin(userToUpdate)

  const onSystemAdminChange = (value: boolean) =>
    onUpdate(
      value ? User.assocAuthGroup(systemAdminGroup)(userToUpdate) : User.dissocAuthGroup(systemAdminGroup)(userToUpdate)
    )

  return (
    <UserEditSection
      description="usersView:profile.sections.accessDescription"
      id="user-edit-access"
      title="usersView:profile.sections.access"
    >
      {visibility.roleInSurvey && (
        <div className="user-edit-fields">
          <FormItem label="usersView:roleInCurrentSurvey">
            <DropdownUserRole
              disabled={!canEditGroup}
              editingLoggedUser={editingLoggedInUser}
              groupUuid={AuthGroup.getUuid(groupInCurrentSurvey)}
              onChange={onSurveyAuthGroupChange}
              showOnlySurveyGroups
              validation={Validation.getFieldValidation(User.keys.authGroupsUuids)(validation)}
            />
          </FormItem>
        </div>
      )}
      <div className="user-edit-section__rows">
        {visibility.systemAdmin && (
          <UserEditSectionRow
            description="usersView:profile.systemAdminDescription"
            title="auth:authGroups.systemAdmin.label"
          >
            <Switch checked={systemAdmin} disabled={!canEdit || !canEditSystemAdmin} onChange={onSystemAdminChange} />
          </UserEditSectionRow>
        )}
        {visibility.surveyManager && (
          <UserEditSectionRow
            description="usersView:profile.surveyManagerDescription"
            title="auth:authGroups.surveyManager.label"
          >
            <Switch
              checked={User.isSurveyManager(userToUpdate)}
              disabled={!canEdit || !canEditSurveyManager}
              onChange={onSurveyManagerChange}
            />
          </UserEditSectionRow>
        )}
        {visibility.maxSurveys && (
          <UserEditSectionRow title="userView.maxSurveysUserCanCreate">
            <Input
              className="max-surveys-input"
              numberFormat={NumberFormats.integer({ allowNegative: false, allowZero: false, maxLength: 3 })}
              onChange={(value) => onUpdate(User.assocMaxSurveys(value)(userToUpdate))}
              type="number"
              validation={Validation.getFieldValidation(User.keysProps.maxSurveys)(validation)}
              value={User.getMaxSurveys(userToUpdate)}
            />
          </UserEditSectionRow>
        )}
      </div>
    </UserEditSection>
  )
}
