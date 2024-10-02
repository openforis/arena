import './ItemEditButtonBar.scss'

import React from 'react'
import PropTypes from 'prop-types'

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
          {onEdit && <ButtonIconEdit disabled={readOnly} showLabel={false} onClick={onEdit} />}
          {onDelete && <ButtonDelete disabled={readOnly} showLabel={false} onClick={onDelete} />}
        </>
      )}
      {editing && (
        <>
          <ButtonSave
            showLabel={false}
            disabled={(validation && Validation.isNotValid(validation)) || !dirty}
            onClick={onSave}
          />
          <ButtonCancel showLabel={false} onClick={onCancel} />
        </>
      )}
    </div>
  )
}

ItemEditButtonBar.propTypes = {
  dirty: PropTypes.bool,
  editing: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  validation: PropTypes.object,
}
