import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { FormItem, Input } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { ItemEditButtonBar } from '@webapp/components/ItemEditButtonBar'
import { useConfirmAsync } from '@webapp/components/hooks'

const validateExtraProp = async (extraProp, items) =>
  Validator.validate(extraProp, {
    name: [
      Validator.validateRequired(Validation.messageKeys.extraPropEdit.nameRequired),
      Validator.validateName(Validation.messageKeys.extraPropEdit.nameInvalid),
      (_, item) => {
        const { name, uuid } = item
        if (StringUtils.isBlank(name)) return null
        const isDuplicate = items.some((extraProp) => extraProp.name === name && extraProp.uuid !== uuid)

        return isDuplicate ? { key: Validation.messageKeys.nameDuplicate } : null
      },
    ],
    value: [Validator.validateRequired(Validation.messageKeys.extraPropEdit.valueRequired)],
  })

export const UserExtraPropEditor = (props) => {
  const {
    editingItems,
    items,
    index,
    name: nameProp,
    newItem = false,
    onDelete: onDeleteProp,
    onEditChange,
    onSave: onSaveProp,
    uuid,
    value: valueProp,
  } = props

  const i18n = useI18n()
  const confirm = useConfirmAsync()

  const initialItem = useMemo(() => ({ name: nameProp, value: valueProp, uuid }), [nameProp, uuid, valueProp])

  const [state, setState] = useState({ ...initialItem, editing: newItem })

  const { editing, name, validation, value } = state

  const editedItem = useMemo(() => ({ name, uuid, value }), [name, uuid, value])
  const dirty = useMemo(() => name !== nameProp || value !== valueProp, [name, nameProp, value, valueProp])

  useEffect(() => {
    if (!editing) return
    validateExtraProp(editedItem, items).then((val) => {
      setState((statePrev) => ({ ...statePrev, validation: val }))
    })
  }, [editedItem, editing, items])

  const toggleEdit = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, editing: !editing }))
    onEditChange(!editing)
  }, [editing, onEditChange])

  const onEdit = useCallback(() => {
    toggleEdit()
  }, [toggleEdit])

  const onNameChange = useCallback((val) => {
    setState((statePrev) => ({ ...statePrev, name: val }))
  }, [])

  const onValueChange = useCallback((val) => {
    setState((statePrev) => ({ ...statePrev, value: val }))
  }, [])

  const onSave = useCallback(() => {
    toggleEdit()
    onSaveProp({ item: editedItem, index })
  }, [editedItem, index, onSaveProp, toggleEdit])

  const onDelete = useCallback(
    async (showConfirm = true) => {
      if (!showConfirm || (await confirm({ key: 'extraProp.editor.confirmDelete', params: { name } }))) {
        onDeleteProp({ item: editedItem, index })
        if (editing) {
          onEditChange(false)
        }
      }
    },
    [confirm, editedItem, editing, index, name, onDeleteProp, onEditChange]
  )

  const onCancel = useCallback(async () => {
    if (newItem) {
      await onDelete(false)
    } else {
      setState(() => ({ ...initialItem }))
      onEditChange(false)
    }
  }, [initialItem, newItem, onDelete, onEditChange])

  return (
    <div className="extra-props display-flex">
      <FormItem label={i18n.t('extraProp.name', { position: index + 1 })}>
        <Input
          disabled={!editing}
          onChange={onNameChange}
          textTransformFunction={StringUtils.normalizeName}
          validation={Validation.getFieldValidation('name')(validation)}
          value={name}
        />
      </FormItem>
      <FormItem label={i18n.t('extraProp.value')}>
        <Input
          disabled={!editing}
          onChange={onValueChange}
          validation={Validation.getFieldValidation('value')(validation)}
          value={value}
        />
      </FormItem>
      <ItemEditButtonBar
        dirty={dirty}
        editing={editing}
        onCancel={onCancel}
        onDelete={editingItems ? undefined : onDelete}
        onEdit={editingItems ? undefined : onEdit}
        onSave={onSave}
        validation={validation}
      />
    </div>
  )
}

UserExtraPropEditor.propTypes = {
  editingItems: PropTypes.bool,
  items: PropTypes.array.isRequired,
  index: PropTypes.number.isRequired,
  name: PropTypes.string,
  newItem: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
  onEditChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  uuid: PropTypes.string,
  value: PropTypes.string,
}
