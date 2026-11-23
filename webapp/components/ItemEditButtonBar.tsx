import './ItemEditButtonBar.scss'

import * as Validation from '@core/validation/validation'
import { ButtonCancel, ButtonDelete, ButtonIconEdit, ButtonSave } from './buttons'
import type { ArenaValidation } from '@openforis/arena-core'

type ItemEditButtonBarProps = {
  dirty?: boolean
  editing?: boolean
  onCancel: (...args: any[]) => any
  onDelete?: (...args: any[]) => any
  onEdit: (...args: any[]) => any
  onSave: (...args: any[]) => any
  readOnly?: boolean
  validation?: ArenaValidation
}

export const ItemEditButtonBar = (props: ItemEditButtonBarProps) => {
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
