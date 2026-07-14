import './UserGroupEdit.scss'

import React from 'react'
import { useParams } from 'react-router'

import * as UserGroup from '@core/user/userGroup/userGroup'
import * as Validation from '@core/validation/validation'

import { ButtonDelete, ButtonSave } from '@webapp/components'
import { FormItemWithInput } from '@webapp/components/form/FormItemWithInput'

import { useEditUserGroup } from './useEditUserGroup'

/**
 * Create/edit/delete page for a single User Group, reading `groupUuid` from the route params.
 * Renders the name field only; labels, qualifiers and members are added by later tasks.
 *
 * @returns {React.ReactElement | null} - The UserGroupEdit component, or null while loading.
 */
const UserGroupEdit = (): React.ReactElement | null => {
  const { groupUuid } = useParams()

  const { ready, dirty, canEdit, canSave, canDelete, userGroup, onNameChange, onSave, onDelete } = useEditUserGroup({
    groupUuid,
  })

  if (!ready) return null

  const validation = UserGroup.getValidation(userGroup)

  return (
    <div className="user-group-edit">
      <FormItemWithInput
        disabled={!canEdit}
        label="usersView:userGroup.name"
        onChange={onNameChange}
        validation={Validation.getFieldValidation('name')(validation)}
        value={UserGroup.getName(userGroup)}
      />

      <div className="user-group-edit__buttons">
        {canEdit && <ButtonSave onClick={onSave} disabled={!canSave || !dirty} className="btn-save" />}
        {canDelete && <ButtonDelete onClick={onDelete} className="btn-s btn-danger" />}
      </div>
    </div>
  )
}

export default UserGroupEdit
