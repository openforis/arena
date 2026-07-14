import './UserGroupEdit.scss'

import React from 'react'
import { useParams } from 'react-router'

import * as UserGroup from '@core/user/userGroup/userGroup'
import * as Validation from '@core/validation/validation'

import { ButtonDelete, ButtonSave } from '@webapp/components'
import { FormItemWithInput } from '@webapp/components/form/FormItemWithInput'
import LabelsEditor from '@webapp/components/survey/LabelsEditor/LabelsEditor'
import { useSurveyLangs } from '@webapp/store/survey'

import { useEditUserGroup } from './useEditUserGroup'
import { UserGroupQualifiersEditor } from './UserGroupQualifiersEditor'

/**
 * Create/edit/delete page for a single User Group, reading `groupUuid` from the route params.
 * Renders the name, label and qualifiers fields; members are added by a later task.
 *
 * @returns {React.ReactElement | null} - The UserGroupEdit component, or null while loading.
 */
const UserGroupEdit = (): React.ReactElement | null => {
  const { groupUuid } = useParams()

  const {
    ready,
    dirty,
    canEdit,
    canSave,
    canDelete,
    userGroup,
    onNameChange,
    onLabelsChange,
    onQualifiersChange,
    onSave,
    onDelete,
  } = useEditUserGroup({
    groupUuid,
  })
  // useSurveyLangs's untyped implementation makes TS infer its return type as `{}`; cast to the
  // `string[]` shape LabelsEditor's `languages` prop expects, following the `useSurveyId() as string`
  // precedent in useEditUserGroup.ts.
  const languages = useSurveyLangs() as string[]

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

      <LabelsEditor
        formLabelKey="usersView:userGroup.label"
        labels={UserGroup.getLabels(userGroup)}
        languages={languages}
        onChange={onLabelsChange}
        readOnly={!canEdit}
        validation={Validation.getFieldValidation('labels')(validation)}
      />

      <UserGroupQualifiersEditor
        qualifiers={UserGroup.getQualifiers(userGroup)}
        onChange={onQualifiersChange}
        readOnly={!canEdit}
      />

      <div className="user-group-edit__buttons">
        {canEdit && <ButtonSave onClick={onSave} disabled={!canSave || !dirty} className="btn-save" />}
        {canDelete && <ButtonDelete onClick={onDelete} className="btn-s btn-danger" />}
      </div>
    </div>
  )
}

export default UserGroupEdit
