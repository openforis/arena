import React from 'react'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { ButtonCancel, ButtonDelete, ButtonIconEdit, ButtonSave } from '@webapp/components'

import { useItemExtraDefEditor } from './useItemExtraDefEditor'

export const ItemExtraDefEditor = (props) => {
  const { index, readOnly, onItemDelete } = props
  const {
    dirty,
    editing,
    i18n,
    itemExtraDef,
    onCancelClick,
    onEditClick,
    onSaveClick,
    updateItemExtraDef,
    validation,
  } = useItemExtraDefEditor(props)

  const { name, dataType } = itemExtraDef

  return (
    <FormItem label={`${i18n.t('categoryEdit.extraProp')} ${index + 1}`}>
      <Input
        value={name}
        readOnly={readOnly || !editing}
        onChange={(value) => {
          const valueNormalized = StringUtils.normalizeName(value)
          const itemExtraDefUpdated = { ...itemExtraDef, name: valueNormalized }
          updateItemExtraDef({ itemExtraDefUpdated })
        }}
        validation={Validation.getFieldValidation(CategoryItemExtraDef.keys.name)(validation)}
      />
      <Dropdown
        readOnly={readOnly || !editing}
        items={Object.keys(CategoryItemExtraDef.dataTypes)}
        itemValue={A.identity}
        itemLabel={(item) => i18n.t(`categoryEdit.extraPropDataType.${item}`)}
        searchable={false}
        selection={dataType}
        onChange={(dataTypeUpdated) =>
          updateItemExtraDef({ itemExtraDefUpdated: { ...itemExtraDef, dataType: dataTypeUpdated } })
        }
        validation={Validation.getFieldValidation(CategoryItemExtraDef.keys.dataType)(validation)}
      />
      {!editing && (
        <>
          <ButtonIconEdit disabled={readOnly} showLabel={false} onClick={onEditClick} />
          <ButtonDelete disabled={readOnly} showLabel={false} onClick={() => onItemDelete({ index })} />
        </>
      )}
      {editing && (
        <>
          <ButtonSave
            className="btn-save"
            showLabel={false}
            disabled={Validation.isNotValid(validation) || !dirty}
            onClick={onSaveClick}
          />
          <ButtonCancel
            className="btn-cancel"
            iconClassName="icon-cross icon-12px"
            showLabel={false}
            onClick={onCancelClick}
          />
        </>
      )}
    </FormItem>
  )
}
