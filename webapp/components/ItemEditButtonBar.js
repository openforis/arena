import './ItemEditButtonBar.scss'

import React from 'react'

import * as Validation from '@core/validation/validation'
import { ButtonCancel, ButtonDelete, ButtonIconEdit, ButtonSave } from './buttons'

export const ItemEditButtonBar = (props) => {
  const {
    dirty = false,
    editing = false,
    onCancel,
    onDelete = null,
    onEdit,
    onSave,
    readOnly = false,
    validation = null,
  } = props

  return (
    <div className="item-edit-button-bar">
      {!editing && !readOnly && (
        <>
          <ButtonIconEdit disabled={readOnly} showLabel={false} onClick={onEdit} />
          {onDelete && <ButtonDelete disabled={readOnly} showLabel={false} onClick={onDelete} />}
        </>
      )}
      {editing && (
        <>
          <ButtonSave showLabel={false} disabled={Validation.isNotValid(validation) || !dirty} onClick={onSave} />
          <ButtonCancel showLabel={false} onClick={onCancel} />
        </>
      )}
    </div>
  )
}
